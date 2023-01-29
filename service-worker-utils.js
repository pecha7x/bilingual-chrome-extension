"use strict";

let baseApiUrl;

const createContextMenu = () => {
  chrome.contextMenus.create({
    'id': 'addToVocabulary',
    'title': 'Add to Vocabulary',
    'contexts': ['selection']
  });
};

const adjective = () => {
  chrome.storage.local.remove('currentUser');
  chrome.windows.create({
    focused: true,
    width: 320,
    height: 280,
    type: 'popup',
    url: 'popup/popup.html',
    top: 0,
    left: 0
  }, () => {});
};

const sendTermToVocabulary = (authToken, termText, vocabularyId) => {
  fetch(baseApiUrl + '/vocabulary-terms', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken
    }),
    body: JSON.stringify({
      termValue: termText,
      vocabularyId: vocabularyId
    })
  }).then(response => {
    if (!response.ok) {
      throw Error(response.message);
    }
    return response;
  }).then(response => {
    console.log(response);
  }).catch(error => {
    console.log(error);
    adjective();
  });
};

const getUserVocabularies = (authToken) => {
  return fetch(baseApiUrl + '/users/vocabularies', {
    headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken
    })
  }).then(response => {
    if (!response.ok) {
      throw Error(response.message);
    }
    return response.json();
  }).then(data => {
    return data.vocabularies.map(vocabulary => ({
      id: vocabulary.id,
      language: vocabulary.language.title
    }));
  }).catch(error => {
    console.log(error);
  });
};

// const emptyUserSchema = {
//   id: null,
//   authToken: null,
//   currentVocabulary: {}, // name:, id:
//   vocabularies: [], // { name:, id: }, ..
// }

const initListeners = () => {
  chrome.runtime.onMessageExternal.addListener((request, _sender, sendResponse) => {
    if (request.token) {
      getUserVocabularies(request.token).then(vocabularies => {
        const user = {
          id: request.userId,
          authToken: request.token,
          vocabularies,
          currentVocabulary: vocabularies[0]
        };

        chrome.storage.local.set({
          currentUser: user
        }, () => {
          sendResponse({
            success: true,
            message: 'Token has been received'
          });
        });
      });
    } else {
      chrome.storage.local.remove('currentUser');
    }
  });

  chrome.contextMenus.onClicked.addListener(itemData => {
    chrome.storage.local.get('currentUser', item => {
      const { currentUser } = item;

      if (!currentUser) {
        return adjective();
      }
      const {
        authToken,
        currentVocabulary
      } = currentUser;

      if (!authToken || !currentVocabulary) {
        return adjective();
      }

      sendTermToVocabulary(authToken, itemData.selectionText, currentVocabulary.id);
    });
  });
};

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  chrome.management.getSelf((self) => {
    baseApiUrl = self.installType === 'development' ? 'http://localhost:3001/api/v1' : 'https://bilingual-backend.herokuapp.com/api/v1';
  });
});

initListeners();
