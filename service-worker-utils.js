'use strict';

const baseApiUrl = () => {
  const isProdMode = 'update_url' in chrome.runtime.getManifest();
  return (isProdMode ? 'https://bilingual.io/api/v1' : 'http://localhost:3001/api/v1');
};

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
  fetch(baseApiUrl() + '/vocabulary-terms', {
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
  }).then(data => {
    return data.term;
  }).catch(error => {
    console.log(error);
    adjective();
  });
};

const getUserVocabularies = (authToken) => {
  return fetch(baseApiUrl() + '/users/vocabularies', {
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

const setCurrentUser = (data, sendResponse) => {
  if (data.token) {
    getUserVocabularies(data.token).then(vocabularies => {
      if (!vocabularies) { return adjective() };

      const user = {
        id: data.userId,
        authToken: data.token,
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
    chrome.storage.local.remove('currentUser', () => { sendResponse({success: true, message: 'The user has been removed'}) });
  }
};

const updateVocabularies = (sendResponse) => {  
  chrome.storage.local.get('currentUser', item => {
    const { currentUser } = item;

    if (!currentUser) { return adjective() }
    
    if (!!currentUser && currentUser.authToken) {
      getUserVocabularies(currentUser.authToken).then(vocabularies => {
        let currentVocabulary = currentUser.currentVocabulary;
        
        if (!vocabularies.find(vocabulary => vocabulary.id === currentVocabulary.id)) {
          currentVocabulary =  vocabularies[0];
        }
  
        chrome.storage.local.set({
          currentUser: {...currentUser, currentVocabulary, vocabularies}
        }, () => {
          sendResponse({
            success: true,
            message: 'Token has been received'
          });
        });
      });
    } else {
      sendResponse({
        success: false,
        message: 'The user unauthorized'
      });
    }
  });
};

const initListeners = () => {
  chrome.runtime.onMessageExternal.addListener((request, _sender, sendResponse) => {
    const { messageType, data } = request;
    if (messageType === 'setCurrentUser') {
      setCurrentUser(data, sendResponse);
    } else if (messageType === 'updateVocabularies') {
      updateVocabularies(sendResponse);
    } else {
      sendResponse({
        success: false,
        message: 'Unknown messageType '
      });
    }
  });

  chrome.contextMenus.onClicked.addListener(itemData => {
    chrome.storage.local.get('currentUser', item => {
      const { currentUser } = item;
  
      if (!currentUser) {
        return adjective();
      }
      
      const { authToken, currentVocabulary } = currentUser;
      if (!authToken || !currentVocabulary) { return adjective() }
  
      sendTermToVocabulary(authToken, itemData.selectionText, currentVocabulary.id);
    });
  });
};

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

initListeners();
