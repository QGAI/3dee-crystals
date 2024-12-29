let gCurrentTab = null;
let gPreviousTab = null;

let gCurrentView = null;
let gPreviousView = null;

let gCamera = {
    position: [0, 0, 0],
    orientation: [0, 0, 0, 0],
};

const stateChanged = () => {
    const updateViewpoint = () => {
        if (gPreviousView !== null) {
            const previousScene = document.querySelector(`#${gPreviousView}`);
            previousScene.dataset.cameraOrientation = gCamera.orientation;
            previousScene.dataset.cameraPosition = gCamera.position;
        }

        const scene = document.querySelector(`#${gCurrentView}`);

        const viewpoint = document.querySelector('viewpoint');

        viewpoint.setAttribute('centerofrotation', scene.dataset.centerOfRotationConst);
        viewpoint.setAttribute('position', scene.dataset.cameraPosition);
        viewpoint.setAttribute('orientation', scene.dataset.cameraOrientation);
    };

    const hidePreviousConfig = () => {
        if (gPreviousView !== null) {
            const previousConfig = document.querySelector(`.config [data-config=${gPreviousView}]`);
            previousConfig.classList.add('hidden');
        }
    };

    const showConfig = () => {
        const config = document.querySelector(`.config [data-config=${gCurrentView}]`);
        config.classList.remove('hidden');
    };

    const hidePreviousNavigationView = () => {
        if (gPreviousTab !== null) {
            const previousNavigationView = document.querySelector(`div[data-nav-view=${gPreviousTab}]`);
            previousNavigationView.classList.add('hidden');
        }
    };

    const showNavigationView = () => {
        const navigationView = document.querySelector(`div[data-nav-view=${gCurrentTab}]`);
        navigationView.classList.remove('hidden');
    };

    const hidePreviousAside = () => {
        if (gPreviousTab !== null) {
            const previousAside = document.querySelector(`div[data-aside=${gPreviousTab}]`);
            previousAside.classList.add('hidden');
        }
    };

    const showAside = () => {
        const aside = document.querySelector(`div[data-aside=${gCurrentTab}]`);
        aside.classList.remove('hidden');
    };

    const showScene = () => {
        const scene = document.querySelector(`#${gCurrentView}`);
        scene.setAttribute('render', 'true');
        scene.setAttribute('visible', 'true');
    }

    const hidePreviousScene = () => {
        if (gPreviousView !== null) {
            const previousScene = document.querySelector(`#${gPreviousView}`);
            previousScene.setAttribute('render', 'false');
            previousScene.setAttribute('visible', 'false');
        }
    };

    hidePreviousNavigationView();
    hidePreviousScene();
    hidePreviousAside();
    hidePreviousConfig();

    updateViewpoint();

    showNavigationView();
    showScene();
    showAside();
    showConfig();
};

const addEventsForNavButtons = () => {
    const navButtons = document.querySelectorAll('#nav input[name="tab"]');

    navButtons.forEach(radioButton => {
        radioButton.addEventListener('change', (e) => {
            gPreviousTab = gCurrentTab
            gCurrentTab = e.target.value;

            document.querySelectorAll(`input[name=${gCurrentTab}].view`).forEach((navigationView) => {
                if (navigationView.checked) {
                    gPreviousView = gCurrentView;
                    gCurrentView = navigationView.value;
                }
            });

            stateChanged();
        });
    });
};

const addEventsForViewButtons = () => {
    const viewButtons = document.querySelectorAll('.view');

    viewButtons.forEach(radioButton => {
        radioButton.addEventListener('change', (e) => {
            const element = e.target;
            gPreviousView = gCurrentView;
            gCurrentView = element.value;

            stateChanged();
        });
    });
};

const addEventsForResetButtons = () => {
    const resetButtons = document.querySelectorAll('.config button.reset-button');

    resetButtons.forEach(resetButton => {
        resetButton.addEventListener('click', () => {
            const viewpoint = document.querySelector('viewpoint');
            const scene = document.querySelector(`#${gCurrentView}`);

            viewpoint.bind = 'true';
            viewpoint.setAttribute('centerofrotation', scene.dataset.centerOfRotationConst);
            viewpoint.setAttribute('position', scene.dataset.cameraPositionConst);
            viewpoint.setAttribute('orientation', scene.dataset.cameraOrientationConst);
        });
    });
};

const addEventsForToggles = () => {
    const toggleButtons = document.querySelectorAll('.config .toggle');

    toggleButtons.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const element = e.target;
            const x3d = document.querySelector('x3d');

            const toggleConnections = (type) => {
                const connections = x3d.querySelectorAll(`#${gCurrentView} ${type}`);

                if (connections.length !== 0) {
                    const state = (connections[0].render !== 'true').toString();
                    connections.forEach((e) => e.setAttribute('render', state));
                    connections.forEach((e) => e.setAttribute('visible', state));
                }
            };

            if (element.name === 'expand_radius') {
                let r = 0;

                if (element.checked) {
                    const tab = document.querySelector(`div[data-aside=${gCurrentTab}]`);
                    r = tab.dataset.maxRadius;
                } else {
                    r = 0.15;
                }

                x3d.querySelectorAll(`#${gCurrentView} .sphere`).forEach((e) => e.setAttribute('scale', `${r} ${r} ${r}`));
                x3d.querySelectorAll(`#${gCurrentView} .segment`).forEach((e) => e.setAttribute('scale', `${r} ${r} ${r}`));

            } else if (element.name === 'edge') {
                toggleConnections('.edge');
            } else if (element.name === 'face_connections') {
                toggleConnections('.face');
                toggleConnections('.face-hidden');
            } else if (element.name === 'inner_connections') {
                toggleConnections('.inner');
            } else if (element.name === 'sphere_segments') {
                const spheres = x3d.querySelectorAll(`#${gCurrentView} .full`);
                const segments = x3d.querySelectorAll(`#${gCurrentView} .segment`);

                const stateSphere = (spheres[0].render !== 'true').toString();
                const stateSegment = (segments[0].render !== 'true').toString();
                segments.forEach((e) => e.setAttribute('render', stateSegment));
                segments.forEach((e) => e.setAttribute('visible', stateSegment));
                spheres.forEach((e) => e.setAttribute('render', stateSphere));
                spheres.forEach((e) => e.setAttribute('visible', stateSphere));
            }

        });
    });
};

const addViewpointChangedEvent = () => {

    document.querySelector('viewpoint').addEventListener('viewpointChanged',
        (e) => {
            gCamera.position = Object.values(e.position);

            let orientation = Object.values(e.orientation[0]);
            orientation.push(e.orientation[1])

            gCamera.orientation = orientation;
        });

};

document.addEventListener('DOMContentLoaded', () => {

    x3dom.runtime.ready = function () {

        addViewpointChangedEvent();

        addEventsForNavButtons();
        addEventsForViewButtons();
        addEventsForToggles();
        addEventsForResetButtons();


        const firstTab = document.querySelector('#nav input[name="tab"]');
        firstTab.dispatchEvent(new Event('change'));
    }
});
