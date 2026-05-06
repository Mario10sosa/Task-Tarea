import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (name: string, email: string, passwordHash: string) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(passwordHash, salt);

  const user = await User.create({
    name,
    email,
    passwordHash: hashed,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    theme: user.theme,
    token: generateToken(user._id.toString()),
  };
};

export const loginUser = async (email: string, passwordHash: string) => {
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(passwordHash, user.passwordHash))) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      theme: user.theme,
      token: generateToken(user._id.toString()),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};
