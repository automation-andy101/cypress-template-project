declare namespace Cypress {
    interface Chainable<Subject = any> {
      navigateToUrl(url: string): Chainable<any>;
      enterText(selector: string, text: string): Chainable<any>;
      clickButton(selector: string): Chainable<any>;
      ClearToken(): Chainable<any>;
      apiGetToken(username: string): Chainable<any>;
      apiGetFoldersWithinPersonalFilesForUser(username: string): Chainable<any>;
      apiGetListofFoldersAndDocsWithinPersonalFiles(username: string): Chainable<any>;
      apiGetChildFoldersForParentFolderForUser(username: string, parentFolderId: string): Chainable<any>;
      apiGetChildFolderByNameForUser(username: string, parentFolderId: string, folderName: string): Chainable<any>;
      apiGetAFolderForUser(username: string, parentFolderId: string, folderName: string): Chainable<any>;
      apiDeleteAFolderForUser(username: string, parentFolderId: string, folderName: string): Chainable<any>;
      apiCheckIfFileAlreadyExistsInPersonalFilesAndDelete(username: string, parentFolderId: string, folderName: string): Chainable<any>;
      apiCheckIfFileAlreadyExistsInPersonalFilesIfNotCreateIt(userRole: string, mimeTypeTemplate: string, parentFolder: string, filename: string): Chainable<any>;
      apiCheckIfFolderAlreadyExistsInPersonalFilesIfNotCreateIt(userRole: string, parentFolder: string, folderName: string): Chainable<any>;
      apiCheckIfFolderAlreadyExistsInBERGInPersonalFilesIfNotCreateIt(userRole: string, parentFolder: string, folderName: string): Chainable<any>;
      apiCheckIfFolderAlreadyExistsInPersonalFilesAndDelete(userRole: string, parentFolderId: string, folderName: string): Chainable<any>;
    }
  }
  