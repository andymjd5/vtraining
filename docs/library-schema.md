# Schéma de la base de données pour la Bibliothèque

## Collection `library_resources`

Cette collection stocke les métadonnées de chaque ressource uploadée par un super-admin.

- **Document ID**: auto-généré

| Champ | Type | Description |
| --- | --- | --- |
| `fileName` | `string` | Le nom du fichier. |
| `fileType` | `string` | Le type de fichier (ex: 'pdf', 'mp4', 'jpg'). |
| `filePath` | `string` | Le chemin vers le fichier dans Firebase Storage. |
| `uploadedBy` | `string` | L'UID du super-admin qui a uploadé le fichier. |
| `createdAt` | `timestamp` | La date de création du document. |
| `assignedToCompanies` | `array` | Un tableau d'IDs des entreprises auxquelles la ressource est assignée. |

## Collection `company_library`

Cette collection gère l'assignation des ressources de la bibliothèque aux étudiants par les company admins.

- **Document ID**: auto-généré

| Champ | Type | Description |
| --- | --- | --- |
| `companyId` | `string` | L'ID de l'entreprise. |
| `resourceId` | `string` | L'ID du document dans la collection `library_resources`. |
| `assignedToStudents` | `array` | Un tableau d'UIDs des étudiants auxquels la ressource est assignée. |
| `assignedBy` | `string` | L'UID du company-admin qui a fait l'assignation. |
| `assignedAt` | `timestamp` | La date de l'assignation. |