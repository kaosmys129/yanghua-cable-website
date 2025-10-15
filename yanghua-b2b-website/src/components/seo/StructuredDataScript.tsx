/**
 * 结构化数据注入组件
 * 用于在页面中安全地注入 JSON-LD 结构化数据
 */

import { validateStructuredData } from '@/lib/structured-data';

interface StructuredDataScriptProps {
  schema: any;
  validate?: boolean;
}

export default function StructuredDataScript({ 
  schema, 
  validate = true 
}: StructuredDataScriptProps) {
  if (validate) {
    const validation = validateStructuredData(schema);
    
    if (!validation.isValid) {
      console.warn('Structured data validation failed:', validation.errors);
      
      // 在开发环境中显示错误
      if (process.env.NODE_ENV === 'development') {
        console.error('Schema validation errors:', validation.errors);
        console.error('Invalid schema:', schema);
      }
    }
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, process.env.NODE_ENV === 'development' ? 2 : 0)
      }}
    />
  );
}

// 多个结构化数据组合组件
export function MultipleStructuredDataScript({ 
  schemas, 
  validate = true 
}: { 
  schemas: any[]; 
  validate?: boolean; 
}) {
  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredDataScript 
          key={index} 
          schema={schema} 
          validate={validate} 
        />
      ))}
    </>
  );
}