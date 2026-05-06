"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reject = exports.accept = exports.getInvitation = exports.invite = void 0;
const invitationService = __importStar(require("../services/invitation.service"));
const invite = async (req, res) => {
    try {
        const { email } = req.body;
        const invitation = await invitationService.createInvitation(req.params.id, email, req.user._id.toString());
        res.status(201).json(invitation);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.invite = invite;
const getInvitation = async (req, res) => {
    try {
        const invitation = await invitationService.getInvitationByToken(req.params.token);
        res.json(invitation);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
exports.getInvitation = getInvitation;
const accept = async (req, res) => {
    try {
        // Only logged in user can accept
        const result = await invitationService.acceptInvitation(req.params.token, req.user._id.toString());
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.accept = accept;
const reject = async (req, res) => {
    try {
        const result = await invitationService.rejectInvitation(req.params.token);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.reject = reject;
