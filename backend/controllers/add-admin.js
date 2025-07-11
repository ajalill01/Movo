const Admin = require('../model/admin');
const bcrypt = require('bcrypt');

const createAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne();

        if (existingAdmin) {
            console.log('Admin already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASS, 10);

        const admin = new Admin({
            email: "movomovo396@gmail.com",
            password: hashedPassword,
        });

        await admin.save();
        console.log('Admin created:', admin);
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

createAdmin();

module.exports = createAdmin;
