#!/usr/bin/env python3
"""
SMTP配置更新脚本
将Zoho SMTP配置更新为Namecheap Private Email配置
"""

import os
import json
from datetime import datetime

class SMTPConfigUpdater:
    def __init__(self):
        self.current_config = {
            "host": "smtppro.zoho.com",
            "port": "465", 
            "secure": "true"
        }
        
        self.new_config = {
            "host": "mail.privateemail.com",
            "port": "587",
            "secure": "false"  # 使用STARTTLS而不是SSL
        }
        
        self.files_to_update = [
            ".env.example",
            "src/lib/email/EmailServiceDebug.ts"
        ]
        
    def backup_files(self):
        """备份要修改的文件"""
        print("📁 备份配置文件...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for file_path in self.files_to_update:
            if os.path.exists(file_path):
                backup_path = f"{file_path}.backup_{timestamp}"
                try:
                    with open(file_path, 'r', encoding='utf-8') as src:
                        content = src.read()
                    with open(backup_path, 'w', encoding='utf-8') as dst:
                        dst.write(content)
                    print(f"   ✅ 已备份: {file_path} -> {backup_path}")
                except Exception as e:
                    print(f"   ❌ 备份失败 {file_path}: {e}")
            else:
                print(f"   ⚠️  文件不存在: {file_path}")
    
    def update_env_example(self):
        """更新.env.example文件"""
        print("🔧 更新.env.example文件...")
        
        file_path = ".env.example"
        if not os.path.exists(file_path):
            print(f"   ❌ 文件不存在: {file_path}")
            return False
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 更新SMTP配置
            updated_content = content.replace(
                'SMTP_HOST="smtppro.zoho.com"',
                'SMTP_HOST="mail.privateemail.com"'
            ).replace(
                'SMTP_PORT="465"',
                'SMTP_PORT="587"'
            ).replace(
                'SMTP_SECURE="true"',
                'SMTP_SECURE="false"'
            ).replace(
                '# Email Service Configuration (Namecheap Enterprise Email)',
                '# Email Service Configuration (Namecheap Private Email)'
            )
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            print(f"   ✅ 已更新: {file_path}")
            return True
            
        except Exception as e:
            print(f"   ❌ 更新失败 {file_path}: {e}")
            return False
    
    def update_debug_file(self):
        """更新EmailServiceDebug.ts文件中的配置说明"""
        print("🔧 更新EmailServiceDebug.ts文件...")
        
        file_path = "src/lib/email/EmailServiceDebug.ts"
        if not os.path.exists(file_path):
            print(f"   ❌ 文件不存在: {file_path}")
            return False
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 更新配置说明
            updated_content = content.replace(
                'smtppro.zoho.com',
                'mail.privateemail.com'
            ).replace(
                'port: 465',
                'port: 587'
            ).replace(
                'secure: true',
                'secure: false'
            )
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            print(f"   ✅ 已更新: {file_path}")
            return True
            
        except Exception as e:
            print(f"   ❌ 更新失败 {file_path}: {e}")
            return False
    
    def generate_deployment_instructions(self):
        """生成部署说明"""
        print("📋 生成部署说明...")
        
        instructions = {
            "timestamp": datetime.now().isoformat(),
            "changes": {
                "smtp_host": {
                    "old": self.current_config["host"],
                    "new": self.new_config["host"]
                },
                "smtp_port": {
                    "old": self.current_config["port"],
                    "new": self.new_config["port"]
                },
                "smtp_secure": {
                    "old": self.current_config["secure"],
                    "new": self.new_config["secure"]
                }
            },
            "deployment_steps": [
                "1. 在生产环境中更新以下环境变量:",
                f"   SMTP_HOST={self.new_config['host']}",
                f"   SMTP_PORT={self.new_config['port']}",
                f"   SMTP_SECURE={self.new_config['secure']}",
                "",
                "2. 重新部署应用程序",
                "",
                "3. 运行邮件测试验证配置是否正确",
                "",
                "4. 监控邮件发送日志确保没有错误"
            ],
            "verification_command": "python diagnose_email_503.py",
            "rollback_config": self.current_config
        }
        
        with open("smtp_config_update_instructions.json", "w", encoding="utf-8") as f:
            json.dump(instructions, f, indent=2, ensure_ascii=False)
            
        print("   ✅ 部署说明已保存到: smtp_config_update_instructions.json")
        
        # 打印关键信息
        print("\n" + "="*60)
        print("🚀 生产环境部署说明")
        print("="*60)
        print("请在生产环境中更新以下环境变量:")
        print(f"SMTP_HOST={self.new_config['host']}")
        print(f"SMTP_PORT={self.new_config['port']}")
        print(f"SMTP_SECURE={self.new_config['secure']}")
        print("\n然后重新部署应用程序并测试邮件功能。")
        print("="*60)
    
    def run_update(self):
        """执行配置更新"""
        print("🔄 开始SMTP配置更新...")
        print(f"从 {self.current_config['host']}:{self.current_config['port']} (SSL)")
        print(f"到 {self.new_config['host']}:{self.new_config['port']} (STARTTLS)")
        print()
        
        # 备份文件
        self.backup_files()
        print()
        
        # 更新配置文件
        success_count = 0
        
        if self.update_env_example():
            success_count += 1
            
        if self.update_debug_file():
            success_count += 1
        
        print()
        
        # 生成部署说明
        self.generate_deployment_instructions()
        
        print(f"\n✅ 配置更新完成! 成功更新了 {success_count} 个文件")
        print("📝 请查看 smtp_config_update_instructions.json 了解部署步骤")

def main():
    updater = SMTPConfigUpdater()
    updater.run_update()

if __name__ == "__main__":
    main()