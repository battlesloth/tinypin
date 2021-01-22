Reef.debug(true);

// force a re-render
app.addSetter("render", (data) => {
    appComponent.render();
});

app.addSetter("loader.show", (data) => {
    data.loading++;
});

app.addSetter("loader.hide", (data) => {
    data.loading--;
});

app.addSetter("load.boards", async (data) => {

    store.do("loader.show");

    let res = await fetch("/api/boards");
    data.boards = await res.json();

    data.initialized = true;
    
    store.do("loader.hide");
});

app.addSetter('load.board', async (data) => {
    store.do("loader.show");

    if ( !data.board || data.board.id != data.hash.board ){
        let res = await fetch("/api/boards/" + data.hash.board);
        data.board = await res.json();
    } 

    store.do("loader.hide");
});

app.addSetter("hash.update", (data) => {
    console.log("hash update");
    data.hash = parseQueryString(window.location.hash.substr(1));
    
    if ( data.hash.board ){
        store.do('load.board');
    } else {
        data.board = null;

        data.pinZoomModal.active = false;
        data.addPinModal.active = false;
        data.aboutModal.active = false;
    }
});

let store = new Reef.Store({
    data: {
        hash: {
            board: null
        },
        initialized: false,
        loading: 0,
        boards: [],
        board: null,
        addPinModal: {
            pinId: null,
            active: false,
            boardId: "",
            newBoardName: null,
            imageUrl: "",
            previewImageUrl: null,
            siteUrl: "",
            description: "",
            saveInProgress: false
        },
        pinZoomModal: {
            active: false,
            pin: null,
            fullDescriptionOpen: false
        },
        aboutModal: {
            active: false
        },
        editBoardModal: {
            active: false,
            name: ""
        },
        editPinModal: {
            active: false,
            pin: null,
            newBoardName: null,
            saveInProgress: false
        }
    },
    getters: app.getGetters(),
    setters: app.getSetters()
});


app.freeze();

// init the app component
const appComponent = new Reef("#app", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div id="navbar"></div>
        <section class="section">
            <div class="container" id="brickwall-container">
                <div id="brickwall" class="brickwall"></div>
            </div>
        </section>
        <footer class="footer" id="footer">
            <div class="content has-text-right">
                <a data-onclick="aboutModal.open">about tinypin</a>
            </div>
        </footer>      

        <div id="addPinModal"></div>
        <div id="pinZoomModal"></div>
        <div id="editBoardModal"></div>
        <div id="aboutModal"></div>
        <div id="editPinModal"></div>
        `
        //<div id="loader" class="button is-text ${data.loading ? 'is-loading' : ''}"></div>
    }
});

// attach all the child components
for (const [name, f] of Object.entries(app.getComponents())) {
    let c = f(store);
    if ( !c ){
        throw(new Error(`component ${name} did not return a Reef component`));
    } else {
        appComponent.attach(c);
    }
}


document.addEventListener('click', (el) => {
    let target = el.target.closest('[data-onclick]');
    if (target) {
        let action = target.getAttribute('data-onclick');
        if (action) {
            try{
                store.do(action, target);
            } catch (err){
                console.error(`Error invoking ${action}:`, err);
            }
        }
    }
});

// focusout bubbles while 'blur' does not.  
document.addEventListener('focusout', (el) => {
    let target = el.target.closest('[data-onblur]');
    if ( target ){
        let method = target.getAttribute('data-onblur');
        if ( method ) {
            store.do(method, target);
        }
    }
});

document.addEventListener('keyup', (el) => {   
    
    if ( store.data.pinZoomModal.active ){
        if ( el.key == "Escape" ){
            store.do('pinZoomModal.close');
            
        } else if ( el.key == "ArrowLeft" ){
            store.do('pinZoomModal.moveLeft');
        } else if ( el.key == "ArrowRight" ){
            store.do('pinZoomModal.moveRight');
        }
    }

    if ( store.data.addPinModal.active ){
        if ( el.key == "Escape" ){
            store.do('addPinModal.close');
        }
    }

    if ( store.data.aboutModal.active ){
        if ( el.key == "Escape" ){
            store.do('aboutModal.close');
        }
    }

});

window.addEventListener("hashchange", () => {
    store.do("hash.update");
});

window.addEventListener('resize', (evt) => {
    store.do("render");
});

Reef.databind(appComponent);

store.do('load.boards');
store.do('hash.update');

appComponent.render();