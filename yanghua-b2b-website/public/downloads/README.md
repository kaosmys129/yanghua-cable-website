# Downloads Directory

This directory contains PDF files and resources available for download on the Yanghua B2B website.

## Directory Structure

```
downloads/
├── company-profile/
│   ├── yanghua_company_profile_en_v2.0.pdf
│   └── yanghua_company_profile_es_v2.0.pdf
├── solutions/
│   ├── flexible_busbar_specification_en_v1.5.pdf
│   └── flexible_busbar_specification_es_v1.5.pdf
└── services/
    ├── service_resources_package_en_v1.0.pdf
    └── service_resources_package_es_v1.0.pdf
```

## File Naming Convention

Files follow the pattern: `{category}_{name}_{language}_{version}.{extension}`

- **category**: The resource category (company, solution, service, etc.)
- **name**: Descriptive name of the resource
- **language**: Language code (en, es)
- **version**: Version number (v1.0, v1.5, v2.0, etc.)
- **extension**: File extension (.pdf)

## Adding New Files

1. Create the appropriate category directory if it doesn't exist
2. Follow the naming convention
3. Update the download configuration in `src/lib/download-config.ts`
4. Test the download functionality

## File Requirements

- PDF files should be optimized for web delivery
- Maximum file size: 10MB per file
- Files should be accessible and properly formatted
- Include both English and Spanish versions when applicable

## Security Notes

- All files in this directory are publicly accessible
- Do not include sensitive or confidential information
- Regularly audit files for relevance and accuracy