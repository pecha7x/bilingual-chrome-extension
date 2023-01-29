"use strict";

const initVocabularySelection = (currentUser) => {
    const items = currentUser.vocabularies.map(vocabulary => ({
        value: vocabulary.id,
        label: vocabulary.language
    }));

    VirtualSelect.init({
        ele: '#vocabularies-select',
        selectedValue: currentUser.currentVocabulary.id,
        hideClearButton: true,
        options: items
    });

    document.querySelector('#vocabularies-select').addEventListener('change', function() {
        const vocabulary = currentUser.vocabularies.find(x => x.id === this.value);
        const userData = { ...currentUser, currentVocabulary: vocabulary };
        chrome.storage.local.set({ currentUser: userData }, () => {});
    });
};

const initLoginText = () => {
    chrome.management.getSelf((self) => {
        const loginUrl = self.installType === 'development' ? 'http://localhost:3000' : 'https://bilingual.ai';
        const loginLink = '<h3>You should <a class="login-link" href="' + loginUrl + '" target="_blank">login</a> before</h3>';
        document.querySelector('#vocabularies-select').innerHTML = loginLink;
        document.querySelector('#vocabularies-select .login-link').addEventListener('click', function() {
            window.open('', '_self', '').close();
        });
    });
};

window.addEventListener('load', function () {
    chrome.storage.local.get('currentUser', item => {
        const currentUser = item.currentUser;
        if(currentUser) {
            initVocabularySelection(currentUser);
        } else {
            initLoginText();
        }
    });
});
