const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env.local' });

async function testSMTPConnection() {
    console.log('=== SMTP连接测试 ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***已设置***' : '未设置');
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('\n正在验证SMTP连接...');
        await transporter.verify();
        console.log('✅ SMTP连接成功！535认证失败问题已解决。');
        
        // 发送测试邮件
        console.log('\n正在发送测试邮件...');
        const info = await transporter.sendMail({
            from: `"Yanghua Flexible Busbar" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // 发送给自己
            subject: 'SMTP测试邮件 - 连接成功',
            text: '这是一封测试邮件，确认SMTP配置正常工作。',
            html: '<p>这是一封测试邮件，确认SMTP配置正常工作。</p>'
        });
        
        console.log('✅ 测试邮件发送成功！');
        console.log('邮件ID:', info.messageId);
        
    } catch (error) {
        console.log('❌ SMTP连接失败:');
        console.log('错误代码:', error.code);
        console.log('错误信息:', error.message);
        console.log('响应代码:', error.responseCode);
        console.log('命令:', error.command);
        
        if (error.code === 'EAUTH' && error.responseCode === 535) {
            console.log('\n🔍 535认证失败问题仍然存在。可能的原因：');
            console.log('1. 需要使用应用程序专用密码');
            console.log('2. Zoho账户需要启用SMTP访问');
            console.log('3. 可能需要OAuth 2.0认证');
        }
    }
}

testSMTPConnection().catch(console.error);