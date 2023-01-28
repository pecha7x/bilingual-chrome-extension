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
        console.log(currentUser.vocabularies)
        const vocabulary = currentUser.vocabularies.find(x => x.id === this.value);
        console.log(vocabulary)
        const userData = { ...currentUser, currentVocabulary: vocabulary };
        console.log(userData)
        chrome.storage.local.set({ currentUser: userData }, () => {});
    });
};

window.addEventListener('load', function () {
    chrome.storage.local.get('currentUser', item => {
        const currentUser = item.currentUser;
        if(currentUser) {
            console.log(currentUser)
            initVocabularySelection(currentUser);
        }
    });
});
