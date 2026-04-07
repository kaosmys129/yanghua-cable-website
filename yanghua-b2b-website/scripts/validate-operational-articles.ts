import { collectArticleOperationalIssues } from '../src/lib/content/articles-validation.ts';

function printGroup(label: string, values: string[]) {
  if (values.length === 0) {
    return;
  }

  console.log(`\n${label} (${values.length})`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
}

async function main() {
  const issues = collectArticleOperationalIssues();

  printGroup('重复 slug', issues.duplicateSlugs);
  printGroup('重复 translationKey+locale', issues.duplicateTranslationLocales);
  printGroup('缺失翻译', issues.missingTranslations);
  printGroup('缺失必填字段', issues.missingRequired);
  printGroup('正文过短', issues.shortBodies);

  if (issues.duplicateSlugs.length || issues.duplicateTranslationLocales.length || issues.missingRequired.length) {
    throw new Error('Articles 运营校验失败：存在阻断性问题。');
  }

  console.log(
    `Articles 运营校验通过。文档数：${issues.index.documents.length}，缺失翻译：${issues.missingTranslations.length}，正文过短：${issues.shortBodies.length}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
