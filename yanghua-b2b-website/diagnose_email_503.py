#!/usr/bin/env python3
"""
邮件服务503错误诊断脚本
用于检查生产环境的邮件API和SMTP配置问题
"""

import requests
import json
import time
from datetime import datetime
import smtplib
import ssl

class EmailServiceDiagnostic:
    def __init__(self):
        self.base_url = "https://www.yhflexiblebusbar.com"
        self.session = requests.Session()  # 使用session来保持cookies
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "api_tests": {},
            "smtp_tests": {},
            "recommendations": []
        }
    
    def test_api_endpoint(self):
        """测试邮件API端点的基本可访问性"""
        print("🔍 测试邮件API端点...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/email/send", timeout=10)
            self.results["api_tests"]["get_request"] = {
                "status_code": response.status_code,
                "success": response.status_code in [200, 405],  # 405 Method Not Allowed is expected for GET
                "response_time": response.elapsed.total_seconds()
            }
            print(f"   GET请求状态码: {response.status_code} ({'✅' if response.status_code in [200, 405] else '❌'})")
        except Exception as e:
            self.results["api_tests"]["get_request"] = {
                "error": str(e),
                "success": False
            }
            print(f"   GET请求失败: {e}")
    
    def test_csrf_endpoint(self):
        """测试CSRF令牌获取"""
        print("🔍 测试CSRF令牌获取...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/csrf", timeout=10)
            self.results["api_tests"]["csrf"] = {
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "has_cookie": "csrf-token" in [cookie.name for cookie in self.session.cookies]
            }
            print(f"   CSRF状态码: {response.status_code} ({'✅' if response.status_code == 200 else '❌'})")
            
            if response.status_code == 200:
                # 检查是否设置了csrf-token cookie
                csrf_cookie = None
                for cookie in self.session.cookies:
                    if cookie.name == "csrf-token":
                        csrf_cookie = cookie.value
                        break
                
                if csrf_cookie:
                    print(f"   ✅ CSRF token已设置到cookie中")
                    return csrf_cookie
                else:
                    print(f"   ❌ 未找到csrf-token cookie")
                    
        except Exception as e:
            self.results["api_tests"]["csrf"] = {
                "error": str(e),
                "success": False
            }
            print(f"   CSRF请求失败: {e}")
        
        return None
    
    def test_email_post_request(self, csrf_token=None):
        """测试邮件发送POST请求"""
        print("🔍 测试邮件发送POST请求...")
        
        # 准备测试数据
        test_data = {
            "type": "contact",
            "name": "Test User",
            "email": "test@example.com",
            "company": "Test Company",
            "country": "Test Country",
            "phone": "1234567890",
            "subject": "Test Subject",
            "message": "This is a test message for diagnostic purposes."
        }
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # 如果有CSRF token，添加到请求头
        if csrf_token:
            headers["X-CSRF-Token"] = csrf_token
            print(f"   使用CSRF token: {csrf_token[:20]}...")
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/email/send",
                json=test_data,
                headers=headers,
                timeout=30
            )
            
            self.results["api_tests"]["post_request"] = {
                "status_code": response.status_code,
                "success": response.status_code not in [503, 500],
                "response_time": response.elapsed.total_seconds(),
                "response_text": response.text[:500] if response.text else None
            }
            
            print(f"   POST请求状态码: {response.status_code}")
            print(f"   响应时间: {response.elapsed.total_seconds():.2f}秒")
            
            if response.status_code == 503:
                print("   ❌ 503 Service Unavailable - 这是我们要诊断的问题")
                self.results["recommendations"].append("邮件服务返回503错误，可能是SMTP连接问题")
            elif response.status_code == 403:
                print("   ❌ 403 Forbidden - CSRF验证失败或权限问题")
                self.results["recommendations"].append("403错误：检查CSRF token验证或API权限配置")
            elif response.status_code == 200:
                print("   ✅ 邮件API工作正常")
            else:
                print(f"   ⚠️  意外的状态码: {response.status_code}")
                if response.text:
                    print(f"   响应内容: {response.text[:200]}")
                
            # 尝试解析响应
            try:
                response_data = response.json()
                self.results["api_tests"]["post_request"]["response_data"] = response_data
                if "error" in response_data:
                    print(f"   错误信息: {response_data['error']}")
            except:
                pass
                
        except Exception as e:
            self.results["api_tests"]["post_request"] = {
                "error": str(e),
                "success": False
            }
            print(f"   POST请求失败: {e}")
    
    def test_smtp_configurations(self):
        """测试不同的SMTP配置"""
        print("🔍 测试SMTP配置...")
        
        # 测试配置1: Zoho SMTP (当前.env.example中的配置)
        zoho_config = {
            "name": "Zoho SMTP",
            "host": "smtppro.zoho.com",
            "port": 465,
            "use_tls": True,
            "username": "info@yhflexiblebusbar.com"
        }
        
        # 测试配置2: Namecheap Private Email
        namecheap_config = {
            "name": "Namecheap Private Email",
            "host": "mail.privateemail.com", 
            "port": 587,
            "use_tls": True,
            "username": "info@yhflexiblebusbar.com"
        }
        
        # 测试配置3: Namecheap Private Email (SSL)
        namecheap_ssl_config = {
            "name": "Namecheap Private Email (SSL)",
            "host": "mail.privateemail.com",
            "port": 465,
            "use_tls": True,
            "username": "info@yhflexiblebusbar.com"
        }
        
        configs = [zoho_config, namecheap_config, namecheap_ssl_config]
        
        for config in configs:
            print(f"   测试 {config['name']}...")
            result = self.test_smtp_connection(config)
            self.results["smtp_tests"][config["name"]] = result
            
            if result["can_connect"]:
                print(f"   ✅ {config['name']} 连接成功")
            else:
                print(f"   ❌ {config['name']} 连接失败: {result.get('error', 'Unknown error')}")
    
    def test_smtp_connection(self, config):
        """测试SMTP连接"""
        try:
            if config["port"] == 465:
                # SSL连接
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(config["host"], config["port"], context=context)
            else:
                # STARTTLS连接
                server = smtplib.SMTP(config["host"], config["port"])
                server.starttls()
            
            # 测试连接但不进行认证（因为我们没有密码）
            server.noop()  # 发送NOOP命令测试连接
            server.quit()
            
            return {
                "can_connect": True,
                "host": config["host"],
                "port": config["port"],
                "connection_type": "SSL" if config["port"] == 465 else "STARTTLS"
            }
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # 分析错误类型
            if "name or service not known" in error_msg or "nodename nor servname provided" in error_msg:
                error_type = "DNS解析失败"
            elif "connection refused" in error_msg:
                error_type = "连接被拒绝"
            elif "timeout" in error_msg:
                error_type = "连接超时"
            elif "certificate" in error_msg or "ssl" in error_msg:
                error_type = "SSL/TLS证书问题"
            else:
                error_type = "未知错误"
            
            return {
                "can_connect": False,
                "error": str(e),
                "error_type": error_type,
                "host": config["host"],
                "port": config["port"]
            }
    
    def analyze_results(self):
        """分析测试结果并生成建议"""
        print("\n📊 分析结果...")
        
        # 检查API是否返回503
        post_result = self.results["api_tests"].get("post_request", {})
        if post_result.get("status_code") == 503:
            self.results["recommendations"].append("确认问题：邮件API返回503错误")
            
            # 检查SMTP连接测试结果
            smtp_working = []
            smtp_failed = []
            
            for name, result in self.results["smtp_tests"].items():
                if result.get("can_connect"):
                    smtp_working.append(name)
                else:
                    smtp_failed.append((name, result.get("error_type", "未知错误")))
            
            if smtp_working:
                self.results["recommendations"].append(f"可用的SMTP配置: {', '.join(smtp_working)}")
            
            if smtp_failed:
                for name, error_type in smtp_failed:
                    self.results["recommendations"].append(f"{name} 失败: {error_type}")
            
            # 生成具体建议
            if not smtp_working:
                self.results["recommendations"].append("所有SMTP配置都无法连接，请检查网络和防火墙设置")
            elif "Namecheap Private Email" in smtp_working:
                self.results["recommendations"].append("建议使用Namecheap Private Email配置替换当前的Zoho配置")
                self.results["recommendations"].append("更新环境变量: SMTP_HOST=mail.privateemail.com")
            
        elif post_result.get("status_code") == 200:
            self.results["recommendations"].append("邮件API工作正常，503错误可能已修复")
        
        # 检查CSRF
        csrf_result = self.results["api_tests"].get("csrf", {})
        if not csrf_result.get("success"):
            self.results["recommendations"].append("CSRF令牌获取失败，可能影响邮件发送")
    
    def generate_report(self):
        """生成诊断报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"email_503_diagnosis_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 详细报告已保存到: {filename}")
        return filename
    
    def print_summary(self):
        """打印诊断摘要"""
        print("\n" + "="*60)
        print("📋 邮件服务503错误诊断摘要")
        print("="*60)
        
        # API测试结果
        print("\n🌐 API测试结果:")
        for test_name, result in self.results["api_tests"].items():
            status = "✅" if result.get("success") else "❌"
            print(f"   {test_name}: {status}")
            if "status_code" in result:
                print(f"      状态码: {result['status_code']}")
        
        # SMTP测试结果
        print("\n📧 SMTP连接测试:")
        for config_name, result in self.results["smtp_tests"].items():
            status = "✅" if result.get("can_connect") else "❌"
            print(f"   {config_name}: {status}")
            if not result.get("can_connect") and "error_type" in result:
                print(f"      错误类型: {result['error_type']}")
        
        # 建议
        print("\n💡 修复建议:")
        for i, recommendation in enumerate(self.results["recommendations"], 1):
            print(f"   {i}. {recommendation}")
        
        print("\n" + "="*60)
    
    def run_diagnosis(self):
        """运行完整诊断"""
        print("🚀 开始邮件服务503错误诊断...")
        print(f"目标URL: {self.base_url}")
        print("-" * 60)
        
        # 1. 测试API端点
        self.test_api_endpoint()
        
        # 2. 获取CSRF令牌
        csrf_token = self.test_csrf_endpoint()
        
        # 3. 测试邮件发送
        self.test_email_post_request(csrf_token)
        
        # 4. 测试SMTP配置
        self.test_smtp_configurations()
        
        # 5. 分析结果
        self.analyze_results()
        
        # 6. 生成报告
        report_file = self.generate_report()
        
        # 7. 打印摘要
        self.print_summary()
        
        return report_file

def main():
    diagnostic = EmailServiceDiagnostic()
    report_file = diagnostic.run_diagnosis()
    
    print(f"\n🎯 诊断完成！详细报告: {report_file}")
    print("\n下一步:")
    print("1. 查看详细的JSON报告")
    print("2. 根据建议修复SMTP配置")
    print("3. 重新部署并测试")

if __name__ == "__main__":
    main()