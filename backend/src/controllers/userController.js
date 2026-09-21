import User from '../models/User.js';
import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { OAuth2Client } from 'google-auth-library';
import { systemEvents } from '../events/systemEvents.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { fullName, email, password, phone, address, telegramUsername } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      address,
      telegramUsername,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'User is blocked' });
      }

      if (user.twoFactorEnabled) {
        return res.json({
          twoFactorRequired: true,
          userId: user._id,
        });
      }

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const verify2FALogin = async (req, res) => {
  const { userId, token } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (verified) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid 2FA token' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.fullName = req.body.name || user.fullName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.location = req.body.location || user.location;
      user.telegramUsername = req.body.telegram || user.telegramUsername;
      if (req.body.password) {
        user.password = req.body.password;
      }
      if (req.body.is2FAEnabled !== undefined) {
        user.twoFactorEnabled = req.body.is2FAEnabled;
      } else if (req.body.twoFactorEnabled !== undefined) {
        user.twoFactorEnabled = req.body.twoFactorEnabled;
      }
      if (req.body.image) {
        user.image = req.body.image;
      }

      const updatedUser = await user.save();
      systemEvents.emit('user_updated', updatedUser);
      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        location: updatedUser.location,
        telegramUsername: updatedUser.telegramUsername,
        image: updatedUser.image,
        role: updatedUser.role,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isBlocked = !user.isBlocked;
      await user.save();
      
      systemEvents.emit('user_blocked', { _id: user._id, isBlocked: user.isBlocked });
      
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.body.productId;

    if (!user.wishlist.some(id => id.toString() === productId)) {
      user.wishlist.push(productId);
      await user.save();
      const updatedProduct = await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } }, { new: true });
      if (updatedProduct) {
        systemEvents.emit('product_updated', updatedProduct);
      }
    }
    
    const populatedUser = await User.findById(user._id).populate('wishlist');
    res.json(populatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    if (user.wishlist.some(id => id.toString() === productId)) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
      await user.save();
      const updatedProduct = await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } }, { new: true });
      if (updatedProduct) {
        systemEvents.emit('product_updated', updatedProduct);
      }
    }
    
    const populatedUser = await User.findById(user._id).populate('wishlist');
    res.json(populatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Google OAuth Sign-In / Sign-Up
// @route   POST /api/users/google
// @access  Public
export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists (by googleId or email)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // If existing email user, link their googleId
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.image.includes('via.placeholder')) user.image = picture;
        await user.save();
      }
    } else {
      // Create new user from Google profile
      user = await User.create({
        fullName: name,
        email,
        googleId,
        image: picture || 'https://via.placeholder.com/150',
        password: null,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked.' });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      image: user.image,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};

export const adminUpdateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.fullName = req.body.name || user.fullName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.telegramUsername = req.body.telegram !== undefined ? req.body.telegram : user.telegramUsername;
      
      if (req.body.role) {
        user.role = req.body.role;
        user.isAdmin = req.body.role === 'admin';
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      systemEvents.emit('user_updated', updatedUser);
      
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      // Prevent deleting self or other safeguards could be here
      await user.deleteOne();
      systemEvents.emit('user_deleted', { _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
