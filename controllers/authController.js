import prisma from '../prisma/client.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();


const signup = async (req, res) => {
    let { username, email, password} = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    password
                },
            });
            const token = await generateAccessToken({id:newUser?.id},'4h');
            res.status(201).json({ user: newUser, token });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error',error: error });
    }
};




const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordCorrect = await comparePasswords(user.password,password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = await generateAccessToken({id:user.id});

        res.status(200).json({ user, token });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error',error});
    }
}

const generateAccessToken = async (payload,expiresIn='1h') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

const comparePasswords = async (hashedPassword, password) => {
    return bcrypt.compare(password, hashedPassword);
}


export { signup, login };