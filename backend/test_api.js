async function run() {
    try {
        const { User } = require('./models');
        const user = await User.findOne({ where: { email: 'admin@docclear.com' } });
        if(!user) {
            console.log('No user'); return;
        }
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user.id, email: user.email, tenant_id: user.tenant_id }, process.env.JWT_SECRET || 'docclear_secret_key_2024');
        
        const res = await fetch('http://localhost:3000/api/v1/config', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e.message);
    }
    process.exit(0);
}
run();
