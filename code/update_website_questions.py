#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新答题网站题目数据工具
"""

import json
import shutil
import os

def update_website_questions(source_json: str, website_dir: str = "/workspace/diabetes-quiz"):
    """更新网站的题目数据"""
    
    # 检查源文件是否存在
    if not os.path.exists(source_json):
        print(f"错误：源文件不存在 {source_json}")
        return False
    
    # 检查网站目录是否存在
    if not os.path.exists(website_dir):
        print(f"错误：网站目录不存在 {website_dir}")
        return False
    
    # 目标文件路径
    target_public = os.path.join(website_dir, "public", "quiz_questions.json")
    target_dist = os.path.join(website_dir, "dist", "quiz_questions.json")
    
    try:
        # 读取新的题目数据进行验证
        with open(source_json, 'r', encoding='utf-8') as f:
            quiz_data = json.load(f)
        
        # 验证数据格式
        required_fields = ['title', 'description', 'time_limit', 'total_questions', 'questions']
        for field in required_fields:
            if field not in quiz_data:
                print(f"错误：题目数据缺少必要字段 '{field}'")
                return False
        
        if not quiz_data['questions']:
            print("错误：题目数据为空")
            return False
        
        print(f"✅ 验证通过：{quiz_data['total_questions']} 道题目")
        print(f"📝 题目标题：{quiz_data['title']}")
        
        # 备份现有文件
        if os.path.exists(target_public):
            backup_public = target_public + ".backup"
            shutil.copy2(target_public, backup_public)
            print(f"📦 已备份原文件：{backup_public}")
        
        if os.path.exists(target_dist):
            backup_dist = target_dist + ".backup"
            shutil.copy2(target_dist, backup_dist)
            print(f"📦 已备份原文件：{backup_dist}")
        
        # 更新public目录的题目文件
        with open(target_public, 'w', encoding='utf-8') as f:
            json.dump(quiz_data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已更新：{target_public}")
        
        # 更新dist目录的题目文件（如果存在）
        if os.path.exists(os.path.dirname(target_dist)):
            with open(target_dist, 'w', encoding='utf-8') as f:
                json.dump(quiz_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 已更新：{target_dist}")
        
        print("\n🎉 网站题目数据更新成功！")
        print("💡 提示：如果网站正在运行，可能需要刷新页面查看新题目")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"错误：题目文件JSON格式有误 {e}")
        return False
    except Exception as e:
        print(f"错误：更新失败 {e}")
        return False

def rebuild_and_deploy(website_dir: str = "/workspace/diabetes-quiz"):
    """重新构建并部署网站"""
    try:
        import subprocess
        
        # 切换到网站目录
        original_dir = os.getcwd()
        os.chdir(website_dir)
        
        print("🔨 正在重新构建网站...")
        result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ 网站构建成功")
            
            # 自动部署（如果有部署脚本）
            dist_dir = os.path.join(website_dir, "dist")
            if os.path.exists(dist_dir):
                print("🚀 正在部署网站...")
                # 这里可以添加自动部署逻辑
                print(f"💡 请手动部署 {dist_dir} 目录到服务器")
            
        else:
            print(f"❌ 构建失败：{result.stderr}")
        
        # 恢复原目录
        os.chdir(original_dir)
        
    except Exception as e:
        print(f"构建过程出错：{e}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='更新答题网站题目数据')
    parser.add_argument('source_json', help='新的题目JSON文件路径')
    parser.add_argument('--website-dir', default='/workspace/diabetes-quiz', help='网站目录路径')
    parser.add_argument('--rebuild', action='store_true', help='更新后重新构建网站')
    
    args = parser.parse_args()
    
    # 更新题目数据
    success = update_website_questions(args.source_json, args.website_dir)
    
    if success and args.rebuild:
        rebuild_and_deploy(args.website_dir)

if __name__ == "__main__":
    main()
