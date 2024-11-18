const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); 

    if (!user) {
      return res.status(401).json({ error: "Invalid token or user does not exist." });
    }

    req.user = { id: user._id, role: user.role }; 
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token or authentication failed." });
  }
};

module.exports = authenticateUser;
