export const AppState = {
    isThemeSwitching: false,
    ageGateConfirmed: localStorage.getItem('ageGateConfirmed') === 'true',
    activePanel: null,
    isModalOpen: false,
    modalSource: null,
};
