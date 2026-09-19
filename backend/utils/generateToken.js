import jwt from 'jsonwebtoken';
 
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export default generateToken;