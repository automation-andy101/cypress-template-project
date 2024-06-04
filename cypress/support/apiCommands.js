export { }

const url = Cypress.env('CYPRESS_TEST_API_URL')
const bergBaseUrl = Cypress.env('')

Cypress.Commands.add("ClearToken", () => {
    cy.clearCookies({ domain: null })
    Cypress.env('token', '')
})


Cypress.Commands.add("apiGetToken", (username) => {
    cy.fixture(`users/${username}.json`).then((user) => {
        // cy.clearAllCookies()
        const authBaseUrl = Cypress.env("AUTH_BASE_URL");
        const realm = Cypress.env("AUTH_REALM");
        const URL = `${authBaseUrl}/realms/${realm}/protocol/openid-connect/token`

        const authorization = 'Basic ' + btoa(Cypress.env('AUTH_CLIENT_ID') + ':')

        cy.intercept('POST', URL, (req) => {
            // set the request body to something different before it's sent to the destination
            req.headers['Authorization'] = authorization;
            req.headers['Host'] = null
        })

        cy.request({
            url: URL,
            method: 'POST',
            form: true,
            headers: {
                'Authorization': authorization,
                'Host': Cypress.env('AUTH_BASE_URL_DOMAIN'),
                'accept': '*/*',
            },
            body: {
                client_id: Cypress.env('AUTH_CLIENT_ID'),
                username: user.username,
                password: Cypress.env('CYPRESS_TESTS_USER_PASSWORD'),
                grant_type: 'password',
                scope: Cypress.env('AUTH_SCOPE'),
            }
        })
        .as('loginResponse')
        .then((response) => {
            const accessToken = response.body['access_token'];
            cy.wrap(accessToken).as('accessToken');
        })
    })
})


Cypress.Commands.add("apiGetFoldersWithinPersonalFilesForUser", (username) => {
    // -my- is 'Personal files' nodeId
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/-my-/children`,
            qs: {
                "skipCount": 0,
                // "maxItems": 40,
                "orderBy": "isFolder DESC,name ASC",
                "include": "path,properties,allowableOperations,permissions,aspectNames,isFavorite,association,isLocked,isLink,isDirectLinkEnabled,definition",
                "relativePath": null,
                "includeSource": true
            },
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            // returns parent node ID
            const parentNodeId = response.body['parentId'];
            cy.wrap(parentNodeId).as('parentNodeId');
        })
    });
})

Cypress.Commands.add("apiGetListofFoldersAndDocsWithinPersonalFiles", (username) => {
    // -my- is 'Personal files' nodeId
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/-my-/children`,
            qs: {
                "skipCount": 0,
                "orderBy": "isFolder DESC,name ASC",
                "include": "path,properties,allowableOperations,permissions,aspectNames,isFavorite,association,isLocked,isLink,isDirectLinkEnabled,definition",
                "relativePath": null,
                "includeSource": true
            },
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            // returns parent node ID
            const listOfFoldersAndDocs = response.body.list.entries;
            cy.wrap(listOfFoldersAndDocs).as('listOfFoldersAndDocs');
        })
    });
})

Cypress.Commands.add("apiGetChildFoldersForParentFolderForUser", (username, parentFolderId) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/${parentFolderId}/children`,
            qs: {
                "skipCount": 0,
                // "maxItems": 500,
                "orderBy": "isFolder DESC,name ASC",
                "include": "path,properties,allowableOperations,permissions,aspectNames,isFavorite,association,isLocked,isLink,isDirectLinkEnabled,definition",
                "relativePath": null,
                "includeSource": true
            },
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            const totalElements = response.body.list.entries.length

            for (let i = 0; i < totalElements; i++) {
                console.log(response.body.list.entries[i].entry.name)
                cy.log(response.body.list.entries[i].entry.name)
            }
            // returns parent node ID
            const parentNodeId = response.body.list.entries[0].entry.parentId;
            cy.wrap(parentNodeId).as('parentNodeId');
        })
    });
})


Cypress.Commands.add("apiGetChildFolderByNameForUser", (username, parentFolderId, folderName) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/${parentFolderId}/children`,
            qs: {
                "skipCount": 0,
                // "maxItems": 500,
                "orderBy": "isFolder DESC,name ASC",
                "include": "path,properties,allowableOperations,permissions,aspectNames,isFavorite,association,isLocked,isLink,isDirectLinkEnabled,definition",
                "relativePath": null,
                "includeSource": true
            },
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            const totalElements = response.body.list.entries.length

            for (let i = 0; i < totalElements; i++) {
                if (response.body.list.entries[i].entry.name === folderName) {
                    const childFolderId = response.body.list.entries[i].entry.id;
                    cy.log(response.body.list.entries[i].entry.id)
                    cy.wrap(childFolderId).as('childFolderId');
                    break
                }
            }
        })
    });
})


Cypress.Commands.add("apiGetAFolderForUser", (username, parentFolderId, folderName) => {
    cy.apiGetChildFolderByNameForUser(username, parentFolderId, folderName)
    cy.get('@childFolderId').then(childFolderId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "GET",
                url: `${url}/nodes/${childFolderId}`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
                cy.log(response.body)
                console.log(response.body.entry.name)
            })
        });
    })
})


Cypress.Commands.add("apiDeleteAFolderForUser", (username, parentFolderId, folderName) => {
    cy.apiGetChildFolderByNameForUser(username, parentFolderId, folderName)
    cy.get('@childFolderId').then(childFolderId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "DELETE",
                url: `${url}/nodes/${childFolderId}`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
                cy.log(response.body)
                console.log(response)
            })
        });
    })
})

Cypress.Commands.add("apiDeleteDocumentForUser", (username, parentFolderId, folderName) => {
    cy.apiGetChildFolderByNameForUser(username, parentFolderId, folderName)
    cy.get('@childFolderId').then(childFolderId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "DELETE",
                url: `${url}/nodes/${childFolderId}`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
            })
        });
    })
})

Cypress.Commands.add("apiCheckIfFileAlreadyExistsInPersonalFilesAndDelete", (userRole, filename) => {
    // ensure that folder name to be created does not already exist. If it does then delete it
    cy.apiGetListofFoldersAndDocsWithinPersonalFiles(userRole)
    cy.get('@listOfFoldersAndDocs').then(listOfFoldersAndDocs => {
        const totalElements = listOfFoldersAndDocs.length

        for (let i = 0; i < totalElements; i++) {
            if (listOfFoldersAndDocs[i].entry.name === filename + ".docx") {
                console.log("FOUND FILE - " + filename + ".docx" + " NOW DELETING!!!!")
                cy.apiDeleteDocumentForUser("Admin", "-my-", filename + '.docx')
            }
        }
    })
})

Cypress.Commands.add("apiCheckIfFileAlreadyExistsInPersonalFilesIfNotCreateIt", (userRole, mimeTypeTemplate, parentFolder, filename) => {
    // check if folder name to be created already exist
    cy.apiGetListofFoldersAndDocsWithinPersonalFiles(userRole)
    cy.get('@listOfFoldersAndDocs').then(listOfFoldersAndDocs => {
        let found = false
        const totalElements = listOfFoldersAndDocs.length

        for (let i = 0; i < totalElements; i++) {
            console.log(listOfFoldersAndDocs[i].entry.name)
            if (listOfFoldersAndDocs[i].entry.name === filename) {
                found = true
                break
            }
        }

        if (!found) {
            cy.apiCreateANewDocument(userRole, mimeTypeTemplate, parentFolder, filename)
        }
    })
})

Cypress.Commands.add("apiCheckIfFolderAlreadyExistsInPersonalFilesIfNotCreateIt", (userRole, parentFolder, folderName) => {
    // check if folder name to be created already exist
    cy.apiGetListofFoldersAndDocsWithinPersonalFiles(userRole)
    cy.get('@listOfFoldersAndDocs').then(listOfFoldersAndDocs => {

        let found = false
        const totalElements = listOfFoldersAndDocs.length

        for (let i = 0; i < totalElements; i++) {
            console.log(listOfFoldersAndDocs[i].entry.name)
            if (listOfFoldersAndDocs[i].entry.name === folderName) {
                found = true
                break
            }
        }

        if (!found) {
            console.log("NOT FOUND!!! CREATING DOC - " + folderName)
            cy.apiCreateANewChildFolder(userRole, parentFolder, folderName)
        }
    })
})

Cypress.Commands.add("apiCheckIfFolderAlreadyExistsInBERGInPersonalFilesIfNotCreateIt", (userRole, parentFolder, folderName) => {
    // check if folder name to be created already exist
    cy.apiGetListofFoldersAndDocsWithinPersonalFiles(userRole)
    cy.get('@listOfFoldersAndDocs').then(listOfFoldersAndDocs => {

        let found = false
        const totalElements = listOfFoldersAndDocs.length

        for (let i = 0; i < totalElements; i++) {
            console.log(listOfFoldersAndDocs[i].entry.name)
            if (listOfFoldersAndDocs[i].entry.name === folderName) {
                found = true
                break
            }
        }

        if (!found) {
            console.log("NOT FOUND!!! CREATING DOC - " + folderName)
            cy.apiCreateANewChildFolder(userRole, parentFolder, folderName)
        }
    })
})


Cypress.Commands.add("apiCheckIfFolderAlreadyExistsInPersonalFilesAndDelete", (userRole, parentFolderId, folderName) => {
    // ensure that folder name to be created does not already exist. If it does then delete it
    cy.apiGetListofFoldersAndDocsWithinPersonalFiles(userRole)
    cy.get('@listOfFoldersAndDocs').then(listOfFoldersAndDocs => {
        const totalElements = listOfFoldersAndDocs.length
        for (let i = 0; i < totalElements; i++) {
            if (listOfFoldersAndDocs[i].entry.name === folderName) {
                console.log("FOUND FOLDER - " + folderName + " NOW DELETING!!!!")
                cy.apiDeleteAFolderForUser(userRole, parentFolderId, folderName)
            }
        }
    })
})

function searchForNodeName(listOfFoldersAndDocs, filename) {
    const totalElements = listOfFoldersAndDocs.length
    let found = false

    return new Promise((resolve) => {
        for (let i = 0; i < totalElements; i++) {
            if (listOfFoldersAndDocs[i].entry.name === filename) {
                found = true
            }
        }
        resolve(found)
    })
}

Cypress.Commands.add("apiDeleteAllFoldersAndDocsUnderPersonalFiles", (userRole) => {
    // check if folder name to be created already exist
    cy.apiGetListofFoldersAndDocsWithinPersonalFiles(userRole)
    cy.get('@listOfFoldersAndDocs').then(listOfFoldersAndDocs => {
        let found = false
        const totalElements = listOfFoldersAndDocs.length

        for (let i = 0; i < totalElements; i++) {
            console.log(listOfFoldersAndDocs[i].entry.name)
            cy.apiDeleteDocument(userRole, "-my-", listOfFoldersAndDocs[i].entry.name)
        }
    })
})

Cypress.Commands.add("apiDeleteDocument", (username, parentFolderId, docNameToDelete) => {
    cy.apiGetChildFolderByNameForUser(username, parentFolderId, docNameToDelete)
    cy.get('@childFolderId').then(childFolderId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "DELETE",
                url: `${url}/nodes/${childFolderId}`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
                cy.log(response.status)
                cy.log(response.body)
                console.log(response)
            })
        });
    })
})


Cypress.Commands.add("apiGetAFolderForUser", (username, parentFolderId, folderName) => {
    cy.apiGetChildFolderByNameForUser(username, parentFolderId, folderName)
    cy.get('@childFolderId').then(childFolderId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "GET",
                url: `${url}/nodes/${childFolderId}`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
                cy.log(response.status)
            })
        });
    })
})


Cypress.Commands.add("apiCreateANewChildFolder", (username, parentFolderId, folderName) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "POST",
            url: `${url}/nodes/${parentFolderId}/children`,
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            },
            body: {
                "name": folderName,
                "nodeType": "cm:folder"
            }
        }).then((response) => {
            cy.log(response.body)
        })
    });
})


// parentFolderId - Personal files - id is '-my-'
Cypress.Commands.add("apiCopyAFolder", (username, parentFolderId, documentName) => {
        // Get parent Node ID - parentNodeId
    cy.apiGetChildFoldersForParentFolderForUser(username, parentFolderId)
    cy.get('@parentNodeId').then(parentNodeId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "POST",
                url: `${url}/nodes/${parentNodeId}/copy`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                },
                body: {
                    "name": documentName,
                    "targetParentId": parentNodeId
                }
            }).then((response) => {
                cy.log(response.status)
                cy.log(response.body)
                console.log(response)
            })
        });
    });
})

// Get ID of document type
// XLSX - XLSX_Template.xlsx
// PPT - PPTX_Template.pptx
// DOCX - DOCX_Template.docx
// DOC - DOC_Template.doc
Cypress.Commands.add("apiGetIdOfMimeType", (username, mimeType) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: Cypress.env('MIME_TYPE_API_ENDPOINT_URL'),
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            },
        }).then((response) => {
            const totalElements = response.body.data.length

            for (let i = 0; i < totalElements; i++) {
                if (response.body.data[i].name === mimeType) {

                    let mimeTypeId = response.body.data[i].nodeRef;
                    mimeTypeId = mimeTypeId.replace('workspace://SpacesStore/', '')

                    cy.wrap(mimeTypeId).as('mimeTypeId');
                    break
                }
            }
        })
    });
})


// example - cy.apiCreateANewDocument('Admin', 'DOCX_Template.docx', '-my-', 'new_document_name')
Cypress.Commands.add("apiCreateANewDocument", (username, docMimeType, parentFolderId, documentName) => {
    // Get ID of mime type
    cy.apiGetIdOfMimeType(username, docMimeType)
    cy.get('@mimeTypeId').then(mimeTypeId => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "POST",
                url: `${url}/nodes/${mimeTypeId}/copy`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                },
                body: {
                    "name": documentName,
                    "targetParentId": parentFolderId
                }
            }).then((response) => {
                cy.log(response.status)
                cy.log(response.body)
                console.log(response)
            })
        });
    });
})


// NEED TO WORK OUT IF THIS METHOD IS USED
Cypress.Commands.add("apiCreateANewDocumentLEGACY", (username, docMimeType, parentFolderId, documentName) => {
    // Get parent Node ID - parentNodeId
    cy.apiGetChildFoldersForParentFolderForUser(username, parentFolderId)
    cy.get('@parentNodeId').then(parentNodeId => {
        // Get ID of mime type
        cy.apiGetIdOfMimeType(username, docMimeType)
        cy.get('@mimeTypeId').then(mimeTypeId => {
            cy.apiGetToken(username)
            cy.get('@accessToken').then(accessToken => {
                cy.request({
                    method: "POST",
                    url: `${url}/nodes/${mimeTypeId}/copy`,
                    failOnStatusCode: true,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + accessToken
                    },
                    body: {
                        "name": documentName,
                        "targetParentId": parentNodeId
                    }
                }).then((response) => {
                    cy.log(response.status)
                    cy.log(response.body)
                    console.log(response)
                })
            });
        });
    });
})


Cypress.Commands.add("apiGetNodeDetails", (username, parentNodeId) => {
    // Get parent Node ID - parentNodeId
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/${parentNodeId}?include=path%2Cproperties%2CallowableOperations%2Cpermissions%2CaspectNames%2CisFavorite%2Cassociation%2CisLocked%2CisLink%2CisDirectLinkEnabled%2Cdefinition`,
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            },

        }).then((response) => {
            cy.log(response.status)
            cy.log(response.body)
            console.log(response)
        })
    });
})


Cypress.Commands.add("apiFindIdOfNestedFolder", (username, folderNames) => {
    let parentFolderId = folderNames[0]
    console.log("1st parentID i s - " + parentFolderId)
        for (let i = 1; i < folderNames.length; i++) {
            cy.apiGetChildFolderId(username, parentFolderId, folderNames[i])
            console.log(folderNames[i])
            cy.get('@childFolderId').then(childFolderId => {
                console.log(childFolderId)
                parentFolderId = childFolderId
            })
        }
})


Cypress.Commands.add("apiGetChildFolderId", (username, parentFolderId, folderName) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/${parentFolderId}/children`,
            qs: {
                "skipCount": 0,
                "maxItems": 500,
                "orderBy": "isFolder DESC,name ASC",
                "include": "path,properties,allowableOperations,permissions,aspectNames,isFavorite,association,isLocked,isLink,isDirectLinkEnabled,definition",
                "relativePath": null,
                "includeSource": true
            },
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            const totalElements = response.body.list.entries.length

            for (let n = 0; n < totalElements; n++) {
                if (response.body.list.entries[n].entry.name === folderName) {
                    const childFolderId = response.body.list.entries[n].entry.id;

                    cy.wrap(childFolderId).as('childFolderId');

                    break
                }
            }
        })
    })
})


Cypress.Commands.add("apiFindIdOfSingleNestedFolder", (username, parentFolderName, childFolderName1) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId
    })
})


Cypress.Commands.add("apiFindIdOfDoubleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            console.log(childFolderId)
        })
    })
})


Cypress.Commands.add("apiFindIdOfTripleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                parentFolderId = childFolderId
            })
        })
    })
})


Cypress.Commands.add("apiCreateFolderInSingleNestedFolder", (username, parentFolderName, childFolderName1, nameOfFolderToCreate) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiCreateANewChildFolder(username, parentFolderId, nameOfFolderToCreate)
    })
})


Cypress.Commands.add("apiCreateFolderInDoubleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, nameOfFolderToCreate) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiCreateANewChildFolder(username, parentFolderId, nameOfFolderToCreate)
        })
    })
})


Cypress.Commands.add("apiCreateFolderInTripleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3, nameOfFolderToCreate) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                parentFolderId = childFolderId

                cy.apiCreateANewChildFolder(username, parentFolderId, nameOfFolderToCreate)
            })
        })
    })
})


Cypress.Commands.add("apiCreateDocumentInSingleNestedFolder", (username, parentFolderName, childFolderName1, docMimeType, documentName) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiCreateANewDocument(username, docMimeType, parentFolderId, documentName)
    })
})

// NEEDS WORK
Cypress.Commands.add("apiCreateDocumentInBERGInSingleNestedFolder", (username, parentFolderName, childFolderName1, docMimeType, documentName) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiCreateANewDocument(username, docMimeType, parentFolderId, documentName)
    })
})


Cypress.Commands.add("apiCreateDocumentInDoubleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, docMimeType, documentName) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        console.log(childFolderId)
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            console.log(childFolderId)
            parentFolderId = childFolderId

            cy.apiCreateANewDocument(username, docMimeType, parentFolderId, documentName)
        })
    })
})


Cypress.Commands.add("apiCreateDocumentInTripleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3, docMimeType, documentName) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                parentFolderId = childFolderId

                cy.apiCreateANewDocument(username, docMimeType, parentFolderId, documentName)
            })
        })
    })
})

Cypress.Commands.add("apiCreateDocumentInQuadrupleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3, childFolderName4, docMimeType, documentName) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        console.log(childFolderId)
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            console.log(childFolderId)
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                console.log(childFolderId)
                parentFolderId = childFolderId

                cy.apiGetChildFolderId(username, parentFolderId, childFolderName4)
                cy.get('@childFolderId').then(childFolderId => {
                    parentFolderId = childFolderId

                    cy.apiCreateANewDocument(username, docMimeType, parentFolderId, documentName)
                })
            })
        })
    })
})


Cypress.Commands.add("apiDeleteFolderInSingleNestedFolder", (username, parentFolderName, childFolderName1, nameOfFolderToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiDeleteAFolderForUser(username, parentFolderId, nameOfFolderToDelete)
    })
})


Cypress.Commands.add("apiDeleteFolderInDoubleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, nameOfFolderToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiDeleteAFolderForUser(username, parentFolderId, nameOfFolderToDelete)
        })
    })
})

Cypress.Commands.add("apiDeleteFolderInTripleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3, nameOfFolderToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                parentFolderId = childFolderId

                cy.apiDeleteAFolderForUser(username, parentFolderId, nameOfFolderToDelete)
            })
        })
    })
})


Cypress.Commands.add("apiDeleteDocumentInSingleNestedFolder", (username, parentFolderName, childFolderName1, nameOfDocumentToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiDeleteDocumentForUser(username, parentFolderId, nameOfDocumentToDelete)
    })
})

Cypress.Commands.add("apiDeleteDocumentInDoubleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, nameOfDocumentToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiDeleteDocumentForUser(username, parentFolderId, nameOfDocumentToDelete)
        })
    })
})

Cypress.Commands.add("apiDeleteDocumentInTripleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3, nameOfDocumentToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                parentFolderId = childFolderId

                cy.apiDeleteDocumentForUser(username, parentFolderId, nameOfDocumentToDelete)
            })
        })
    })
})


Cypress.Commands.add("apiDeleteDocumentInQuadrupleNestedFolder", (username, parentFolderName, childFolderName1, childFolderName2, childFolderName3, childFolderName4, nameOfDocumentToDelete) => {
    let parentFolderId = parentFolderName

    cy.apiGetChildFolderId(username, parentFolderId, childFolderName1)
    cy.get('@childFolderId').then(childFolderId => {
        parentFolderId = childFolderId

        cy.apiGetChildFolderId(username, parentFolderId, childFolderName2)
        cy.get('@childFolderId').then(childFolderId => {
            parentFolderId = childFolderId

            cy.apiGetChildFolderId(username, parentFolderId, childFolderName3)
            cy.get('@childFolderId').then(childFolderId => {
                parentFolderId = childFolderId

                cy.apiGetChildFolderId(username, parentFolderId, childFolderName4)
                cy.get('@childFolderId').then(childFolderId => {
                    parentFolderId = childFolderId

                    cy.apiDeleteDocumentForUser(username, parentFolderId, nameOfDocumentToDelete)
                })
            })
        })
    })
})

Cypress.Commands.add("apiGetListOfFavouritesForUser", (username) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/people/-me-/favorites?maxItems=8000&include=path`,
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            // returns parent node ID
            const listOfFavourites = response.body['list'];
            cy.wrap(listOfFavourites).as('listOfFavourites');
        })
    });
})

Cypress.Commands.add("apiRemoveAllFavourites", (username) => {
    cy.apiGetListOfFavouritesForUser(username)
    cy.get('@listOfFavourites').then(listOfFavourites => {
        const totalElements = listOfFavourites.entries.length

        if (totalElements > 0) {
            for (let i = 0; i < totalElements; i++) {
                cy.apiRemoveAFavourite(username, listOfFavourites.entries[i].entry.targetGuid)
            }
        }
    })
})

Cypress.Commands.add("apiRemoveAFavourite", (username, favouriteTargetGuid) => {
    cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "DELETE",
                url: `${url}/people/-me-/favorites/${favouriteTargetGuid}`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
                cy.log(response.status)
            })
        });
})

Cypress.Commands.add("apiFindSiteByNameInBerg", (siteName, username) => {
    cy.apiGetListOfSitesInBerg(siteName, username)
    cy.get('@listOfSitesInBergMatchingSiteName').then(listOfSitesInBergMatchingSiteName => {
        cy.apiGetToken(username)
        cy.get('@accessToken').then(accessToken => {
            cy.request({
                method: "GET",
                url: `${url}/queries/sites?term="${siteName}"`,
                failOnStatusCode: true,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + accessToken
                }
            }).then((response) => {
                cy.log(response.status)
                cy.log(response.body)
                console.log(response)
            })
        });
    })
})

Cypress.Commands.add("apiFindSiteByNameInBerg", (siteName, username) => {
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/queries/sites?term="${siteName}"`,
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            cy.log(response.status)
            cy.log(response.body)
            console.log(response)
        })
    })
})



// Returns an array of objects that match the search criteria
Cypress.Commands.add("apiGetSitesInBergMatchingName", (siteName, username) => {
    cy.request({
        method: "GET",
        url: `${url}/queries/sites?term="${siteName}"`,
        failOnStatusCode: true,
        auth: {
            username: username,
            password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
        }
    }).then((response) => {
        const listOfSites = response.body['list'];
        cy.wrap(listOfSites).as('listOfSites');
    })
})

// If site in BERG does not exist then create it
Cypress.Commands.add("apiCreateSiteInBergIfNotExist", (siteName, username) => {
    cy.apiGetSitesInBergMatchingName(siteName, username)
    cy.get('@listOfSites').then(listOfSites => {
        let siteExists = false
        const totalElements = listOfSites.entries.length
        let siteCreation = false
        let i = 0

        do {
            if (totalElements > 0) {
                if (listOfSites.entries[i].entry.title.toLowerCase() === siteName.toLowerCase()) {
                    siteExists = true
                }
            }

            if ((totalElements === 0) || ((totalElements) === (i + 1)) && (siteExists === false)) {
                // site does not exist, therefore create it
                cy.apiCreateSiteInBerg(siteName, username)
                cy.get('@siteCreated').then(siteCreated => {
                    siteCreation = true
                    cy.wrap(siteCreation).as('siteCreation');
                })

            } else if ((totalElements) === (i + 1) && (siteExists === true)) {
                cy.wrap(siteCreation).as('siteCreation');
            }
            i = i + 1
        } while (i < totalElements)
    })
})

// Create site in BERG
Cypress.Commands.add("apiCreateSiteInBerg", (siteName, username) => {
    let siteCreated = false
    cy.request({
        method: "POST",
        url: `${Cypress.env('BERG_API_ENDPOINT_URL')}/sites`,
        failOnStatusCode: true,
        auth: {
            username: username,
            password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
        },
        body: {
            "id": siteName,
            "title": siteName,
            "description": siteName,
            "visibility": "PUBLIC"
        }
    }).then((response) => {
        if (response.status === 201) {
            siteCreated = true
            cy.wrap(siteCreated).as('siteCreated')
        } else {
            cy.wrap(siteCreated).as('siteCreated')
        }
    })
})

// Add a user to a site in BERG
// siteRole - this can be one of the following -
// Collaborator
// Manager
// Contributor
Cypress.Commands.add("apiAddUserToSiteInBerg", (siteName, bergUsername, userRole, bergSiteRole) => {
    const person = cy.fixture(`users/${userRole}.json`)
    let userAddedToSite = false

    person.then((icicleUser) => {
        cy.request({
            method: "POST",
            // url: `${bergBaseUrl}/groups/GROUP_site_${siteName.toLowerCase()}_Site${bergSiteRole}/members`,
            url: `${bergBaseUrl}/groups/GROUP_site_${siteName}_Site${bergSiteRole}/members`,
            failOnStatusCode: true,
            auth: {
                username: bergUsername,
                password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
            },
            body: {
                "id": icicleUser.username,
                "memberType": "PERSON"
            }
        }).then((response) => {
            if (response.body === 201) {
                userAddedToSite = true
                cy.wrap(userAddedToSite).as('userAddedToSite')
            } else {
                cy.wrap(userAddedToSite).as('userAddedToSite')
            }
        })
    })
})

// GET list of sites that a user is a member of
Cypress.Commands.add("apiGetListOfSitesForUserInBerg", (bergUsername, userRole) => {
    const person = cy.fixture(`users/${userRole}.json`)

    person.then((icicleUser) => {
        cy.request({
            method: "GET",
            url: `${bergBaseUrl}/people/${icicleUser.username}/sites`,
            failOnStatusCode: true,
            auth: {
                username: bergUsername,
                password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
            },
        }).then((response) => {

            const listOfSites = response.body['list'];
            cy.wrap(listOfSites).as('listOfSites');
        })
    })
})

// Add user to site if they are not already a member in BERG
Cypress.Commands.add("apiAddUserToSiteIfNotAlreadyAMemberInBerg", (siteName, bergUsername, icicleUserRole, bergSiteRole) => {
    cy.apiGetListOfSitesForUserInBerg(bergUsername, icicleUserRole)
    cy.get('@listOfSites').then(listOfSites => {
        let memberOfSite = false
        let userAddedToSite = false
        const totalElements = listOfSites.entries.length

        let i = 0
        do {
            if (totalElements > 0) {
                if (listOfSites.entries[i].entry.site.id.toLowerCase() === siteName.toLowerCase()) {
                    memberOfSite = true
                }
            }
            // If user is NOT a member of the site then add the user to the site
            if ((((totalElements) === (i + 1)) && (memberOfSite === false)) || totalElements === 0) {
                cy.apiAddUserToSiteInBerg(siteName, bergUsername, icicleUserRole, bergSiteRole)
                cy.get('@userAddedToSite').then(userAddedToSite => {
                    userAddedToSite = true
                    cy.wrap(userAddedToSite).as('userAddedToSite');
                })
            } else if ((totalElements) === (i + 1) && (memberOfSite === true)) {
                cy.wrap(userAddedToSite).as('userAddedToSite');
            }

            i = i + 1
        } while (i < totalElements)
    })
})


// If site in BERG does not exist then create it and add user to it
Cypress.Commands.add("apiCreateSiteInBergIfNotExistAndAddUser", (siteName, bergUsername, icicleUserRole, bergSiteRole) => {
    cy.apiCreateSiteInBergIfNotExist(siteName, bergUsername)
    cy.get('@siteCreation').then(siteCreation => {
        // add user to site
        cy.apiAddUserToSiteIfNotAlreadyAMemberInBerg(siteName, bergUsername, icicleUserRole, bergSiteRole)
        cy.get('@userAddedToSite').then(userAddedToSite => {
            if (userAddedToSite) {
                console.log("User added to SITE!!!!!!!")
            } else {
                console.log("User NOT added to SITE!!!!!!!")
            }
        })
    })
})

Cypress.Commands.add("apiGetListOfNodesUnderSharedLibSite", (username) => {
    // -my- is 'Personal files' nodeId
    cy.apiGetToken(username)
    cy.get('@accessToken').then(accessToken => {
        cy.request({
            method: "GET",
            url: `${url}/nodes/-my-/children`,
            qs: {
                "skipCount": 0,
                "orderBy": "isFolder DESC,name ASC",
                "include": "path,properties,allowableOperations,permissions,aspectNames,isFavorite,association,isLocked,isLink,isDirectLinkEnabled,definition",
                "relativePath": null,
                "includeSource": true
            },
            failOnStatusCode: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        }).then((response) => {
            // returns parent node ID
            const listOfFoldersAndDocs = response.body.list.entries;
            cy.wrap(listOfFoldersAndDocs).as('listOfFoldersAndDocs');
        })
    });
})

Cypress.Commands.add("apiCheckInBergIfFileAlreadyExistsInSharedLibrariesSiteIfNotCreateIt", (bergUsername, siteName, folderPath, nodeName, nodeType) => {
    // check if file name to be created already exist
    cy.apiGetListOfNodesInBergUnderSharedLibSite(bergUsername, siteName, folderPath)
    cy.get('@listOfNodes').then(listOfNodes => {
        let found = false
        const totalElements = listOfNodes.length

        for (let i = 0; i < totalElements; i++) {
            console.log(listOfNodes[i].entry.name)
            if (listOfNodes[i].entry.name === filename) {
                found = true
                break
            }
        }

        if (!found) {
            cy.apiCreateANewNodeInASharedLibSite(bergUsername, siteName, folderPath, nodeName, nodeType)
        }
    })
})


Cypress.Commands.add("apiCheckInBergIfFileAlreadyExistsInPersonalFilesIfNotCreateIt", (userRole, folderPath, nodeName, nodeType) => {
    const person = cy.fixture(`users/${userRole}.json`)
    person.then((user) => {
        // check if file name to be created already exist
        cy.apiGetListofNodesInBergUnderPersonalFiles(user.username, folderPath)
        cy.get('@listOfNodes').then(listOfNodes => {
            let found = false
            const totalElements = listOfNodes.length

            for (let i = 0; i < totalElements; i++) {
                console.log(listOfNodes[i].entry.name)
                if (listOfNodes[i].entry.name === filename) {
                    found = true
                    break
                }
            }

            if (!found) {
                cy.apiCreateANewNodeInPersonalFiles(user.username, folderPath, nodeName, nodeType)
            }
        })
    })

})

Cypress.Commands.add("apiGetListOfNodesInBergUnderSharedLibSite", (bergUsername, siteName, pathToFolder) => {
    cy.request({
        method: "GET",
        url: `${bergBaseUrl}/nodes/-root-/children?relativePath=Sites/${siteName}/documentLibrary/${pathToFolder}`,
        failOnStatusCode: true,
        auth: {
            username: bergUsername,
            password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
        },
    }).then((response) => {
        const listOfNodes = response.body['list'];
        cy.wrap(listOfNodes).as('listOfNodes');
    })
})

Cypress.Commands.add("apiGetListofNodesInBergUnderPersonalFiles", (username, pathToFolder) => {
    cy.request({
        method: "GET",
        url: `${bergBaseUrl}/nodes/-my-/children?relativePath=${pathToFolder}`,
        failOnStatusCode: true,
        auth: {
            username: username,
            password: Cypress.env('DEFAULT_PASSWORD1'),
        },
    }).then((response) => {
        const listOfNodes = response.body['list'];
        cy.wrap(listOfNodes).as('listOfNodes');
    })
})


// nodeType -
// folder - "nodeType":"cm:folder"
// file - "nodeType":"cm:content"
// example of relativePath - "Sites/cypress-test-site/documentLibrary/test-folder-1"
Cypress.Commands.add("apiCreateANewNodeInASharedLibSite", (bergUsername, siteName, folderPath, nodeName, nodeType) => {
    cy.request({
        method: "POST",
        url: `${bergBaseUrl}/nodes/-root-/children`,
        failOnStatusCode: true,
        auth: {
            username: bergUsername,
            password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
        },
        body: {
            name: nodeName,
            nodeType: nodeType,
            relativePath: "Sites/" + siteName + "/documentLibrary/" + folderPath
        }
    }).then((response) => {
        cy.log(response.status)
    })
})

// nodeType
// folder - "nodeType":"cm:folder"
// file - "nodeType":"cm:content"
// example of relativePath - "Personal-files-folder-1/test-folder-2"
Cypress.Commands.add("apiCreateANewNodeInPersonalFiles", (bergUsername, folderPath, nodeName, nodeType) => {
    cy.request({
        method: "POST",
        url: `${bergBaseUrl}/nodes/-my-/children`,
        failOnStatusCode: true,
        auth: {
            username: bergUsername,
            password: Cypress.env('DEFAULT_PASSWORD1'),
        },
        body: {
            name: nodeName,
            nodeType: nodeType,
            relativePath: folderPath
        }
    }).then((response) => {
        cy.log(response.status)
    })
})

Cypress.Commands.add("apiDeleteNodesUnderSharedLibSite", (bergUsername, nodeId) => {
    cy.request({
        method: "DELETE",
        url: `${bergBaseUrl}/nodes/${nodeId}`,
        failOnStatusCode: true,
        auth: {
            username: bergUsername,
            password: Cypress.env('BERG_ADMIN_USER_PASSWORD'),
        },
    }).then((response) => {
        cy.log(response.status);
    })
})

Cypress.Commands.add("apiDeleteNodesUnderPersonalFiles", (bergUsername, nodeId) => {
    cy.request({
        method: "DELETE",
        url: `${bergBaseUrl}/nodes/${nodeId}`,
        failOnStatusCode: true,
        auth: {
            username: bergUsername,
            password: Cypress.env('DEFAULT_PASSWORD1'),
        },
    }).then((response) => {
        cy.log(response.status);
    })
})

Cypress.Commands.add("apiGetListOfNodesUnderSharedLibSiteAndDelete", (bergUsername, siteName, pathToFolder) => {
    cy.apiGetListOfNodesInBergUnderSharedLibSite(bergUsername, siteName, pathToFolder)
    cy.get('@listOfNodes').then(listOfNodes => {
        const totalElements = listOfNodes.entries.length
        let nodeId = ""

        for (let i = 0; i < totalElements; i++) {
            nodeId = listOfNodes.entries[i].entry.id
            cy.apiDeleteNodesUnderSharedLibSite(bergUsername, nodeId)
        }
    })
})

Cypress.Commands.add("apiGetListOfNodesUnderPersonalFilesAndDelete", (userRole, pathToFolder) => {
    const person = cy.fixture(`users/${userRole}.json`)
    person.then((user) => {
        cy.apiGetListofNodesInBergUnderPersonalFiles(user.username, pathToFolder)
        cy.get('@listOfNodes').then(listOfNodes => {
            const totalElements = listOfNodes.entries.length
            let nodeId = ""

            for (let i = 0; i < totalElements; i++) {
                nodeId = listOfNodes.entries[i].entry.id
                cy.apiDeleteNodesUnderPersonalFiles(user.username, nodeId)
            }
        })
    })
})


Cypress.Commands.add("apiDeleteHomepageForUser", (userRole) => {
    const person = cy.fixture(`users/${userRole}.json`)
    person.then((user) => {
        cy.apiGetToken(userRole)
        cy.get('@accessToken').then(accessToken => {
                cy.request({
                    method: "DELETE",
                    url: Cypress.env('BERG_PEOPLE_API_ENDPOINT_URL') + `${user.username}/preferences?pf=org.trinity.icicle.user.homePage`,
                    failOnStatusCode: true,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + accessToken
                    }
                }).then((response) => {
                    cy.log(response.status)
                })
            });
    })
})
