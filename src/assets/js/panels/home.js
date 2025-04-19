import { config, database, logger, changePanel, appdata, setStatus, pkg, popup } from '../utils.js'

const { Launch } = require('minecraft-java-core')
const { shell, ipcRenderer } = require('electron')

class Home {
    static id = "home";
    async init(config) {
        this.config = config;
        this.db = new database();
        this.news();
        this.socialLick();
        this.instancesSelect();
        document.querySelector('.settings-btn').addEventListener('click', e => {
            changePanel('settings');
        });
        
        let socials = document.querySelectorAll('.news-page-redirect')

        socials.forEach(social => {
            social.addEventListener('click', e => {
                shell.openExternal(e.target.dataset.url)
            })
        });

        const homeIcon = document.getElementById('home-buttom');
        const settingsIcon = document.getElementById('settings-btn');
        const shopIcon = document.getElementById('shop-buttom');
        const webIcon = document.getElementById('web-button');
        const selectBar = document.querySelector('.select-bar');
        if (!homeIcon || !settingsIcon || !selectBar || !shopIcon || !webIcon) {
            console.error('Uno de los elementos no fue encontrado en el init.');
            return;
        }
        shopIcon.addEventListener('click', e => {
            shell.openExternal(e.target.dataset.url)
        })
        webIcon.addEventListener('click', e => {
            shell.openExternal(e.target.dataset.url)
        })
        const posiciones = {
            home: 29.7,
            shop: 24,
            web: 18,
            settings: 2.3,
        };
        let resetTimeout = null;
        const moverBarrita = (bottomPosition) => {
            if (resetTimeout) {
                clearTimeout(resetTimeout);
                resetTimeout = null;
        }
        selectBar.style.bottom = bottomPosition + 'rem';
        };
        const resetBarritaConRetraso = () => {
            resetTimeout = setTimeout(() => {
                moverBarrita(posiciones.home);
            }, 300);
        };
        homeIcon.addEventListener('mouseenter', () => {
            moverBarrita(posiciones.home);
        });
        settingsIcon.addEventListener('mouseenter', () => {
            moverBarrita(posiciones.settings);
        });
        shopIcon.addEventListener('mouseenter', () => {
            moverBarrita(posiciones.shop);
        });
        webIcon.addEventListener('mouseenter', () => {
            moverBarrita(posiciones.web);
        });
        homeIcon.addEventListener('mouseleave', () => {
            resetBarritaConRetraso();
        });
        shopIcon.addEventListener('mouseleave', () => {
            resetBarritaConRetraso();
        });
        settingsIcon.addEventListener('mouseleave', () => {
            resetBarritaConRetraso();
        });
        webIcon.addEventListener('mouseleave', () => {
            resetBarritaConRetraso();
        });
        moverBarrita(posiciones.home);
        const buttons = document.querySelectorAll('[data-tooltip]');
        const tooltip = document.getElementById('tooltip');
        const tooltipTextElement = document.getElementById('tooltip-text');
        const tooltipFooterElement = document.getElementById('tooltip-footer');
        let showTimeout, hideTimeout;

        buttons.forEach(button => {
            button.addEventListener('mouseenter', function () {
                clearTimeout(hideTimeout);
                clearTimeout(showTimeout);

                const tooltipText = this.getAttribute('data-tooltip');
                const footerText = this.getAttribute('data-footer');
                const rect = this.getBoundingClientRect();
                const position = this.getAttribute('data-position');

                let left, top;

                switch (position) {
                    case 'right':
                        left = rect.right + 10;
                        top = rect.top + window.scrollY;
                        break;
                    case 'bottom':
                        left = rect.left + window.scrollX;
                        top = rect.bottom + 10 + window.scrollY;
                        break;
                    case 'left':
                        left = rect.left - tooltip.offsetWidth - 10;
                        top = rect.top + window.scrollY;
                        break;
                    default:
                        left = rect.left + window.scrollX;
                        top = rect.top - tooltip.offsetHeight - 10 + window.scrollY;
                        break;
                }

                showTimeout = setTimeout(() => {
                    tooltipTextElement.textContent = tooltipText;
                    tooltip.style.display = 'block';
                    tooltip.style.left = `${left}px`;
                    tooltip.style.top = `${top}px`;
                    tooltip.offsetHeight;
                    tooltip.style.opacity = '1';
    
                    if (footerText) {
                        tooltipFooterElement.textContent = footerText;
                        tooltipFooterElement.style.display = 'block';
                    } else {
                        tooltipFooterElement.style.display = 'none';
                    }
                }, 300);
            });
    
            button.addEventListener('mouseleave', function () {
                clearTimeout(showTimeout);
    
                hideTimeout = setTimeout(() => {
                    tooltip.style.opacity = '0';
                    setTimeout(() => {
                        tooltip.style.display = 'none';
                    }, 300);
                }, 300);
            });
        });
        let currentGroup = 0;

        function animateSocialBlocks() {
            const socialBlocks = document.querySelectorAll('.social-block');
            const icons = document.querySelectorAll('.icon-social');

            if (socialBlocks.length === 0 || icons.length === 0) return;

            const groupA = Array.from(socialBlocks).filter((_, index) => index % 2 === 0);
            const groupB = Array.from(socialBlocks).filter((_, index) => index % 2 !== 0);
            const iconGroupA = Array.from(icons).filter((_, index) => index % 2 === 0);
            const iconGroupB = Array.from(icons).filter((_, index) => index % 2 !== 0);

            const groups = [groupA, groupB];
            const iconGroups = [iconGroupA, iconGroupB];

            const showGroup = (group, icons) => {
                group.forEach((block, i) => {
                    setTimeout(() => {
                        block.style.visibility = 'visible';
                    }, i * 100);
                });
                icons.forEach((icon, i) => {
                    setTimeout(() => {
                        icon.style.opacity = '1';
                        icon.style.pointerEvents = 'auto';
                    }, i * 100);
                });
            };

            const hideGroup = (group, icons) => {
                group.forEach((block, i) => {
                    setTimeout(() => {
                        block.style.visibility = 'hidden';
                    }, i * 100);
                });
                icons.forEach((icon, i) => {
                    setTimeout(() => {
                        icon.style.opacity = '0';
                        icon.style.pointerEvents = 'none';
                    }, i * 100);
                });
            };

            const current = groups[currentGroup];
            const currentIcons = iconGroups[currentGroup];
            const next = groups[1 - currentGroup];
            const nextIcons = iconGroups[1 - currentGroup];

            hideGroup(current, currentIcons);
            setTimeout(() => showGroup(next, nextIcons), 600);

            currentGroup = 1 - currentGroup;

            setTimeout(animateSocialBlocks, 5000);
        }

        animateSocialBlocks();
    }

    async news() {
        let newsElement = document.querySelector('.btm-pg-news');
        let news = await config.getNews().then(res => res).catch(err => {
            return false;
        });
        if (news) {
            if (!news.length) {
                console.log('No hay noticias disponibles.');
                let blockNews = document.createElement('div');
                blockNews.classList.add('news-block');
                blockNews.innerHTML = `
                    <div class="contenido-news">
                            <div class="c-giXSU c-iqPLsY">
                                <a class="fondo-news" href="">
                                    <div class="post-top">
                                        <div>
                                            <span class="type ${News.type}"></span>
                                            <h1 class="title-page">No hay noticias disponibles</h1>
                                        </div>
                                        <div class="post-date">
                                            <div class="relative-time"></div>
                                        </div>
                                    </div>
                                    <div class="meta-bottom">
                                        <div class="author">
                                            ${skinUrl ? `<img class="skin" src="${skinUrl}">` : ''}
                                            <div class="news-author"></div>
                                        </div>
                                        <div class="read-more"></div>
                                    </div>
                                </a>
                            </div>
                        </div>`;
                newsElement.appendChild(blockNews);
            } else {
                let primeras12Noticias = news.slice(0, 12);

                for (let News of primeras12Noticias) {
                    console.log('Procesando noticia:', News);

                    let rewardMap = {
                        "si": "mostrando"
                    };
                    let rewardUrl = rewardMap[News.reward] || "";
                
                    let backgroundStyle = News.background_url && News.background_url.trim() !== ""
                        ? `background-image: url('${News.background_url}'); background-size: cover; background-position: center;`
                        : '';
                
                    let blockNews = document.createElement('div');
                    blockNews.classList.add('link-container');
                
                    blockNews.innerHTML = `
                        <div class="contenido-news">
                            <div class="c-giXSU c-iqPLsY">
                                <a class="fondo-news" data-url="${News.redirect}">
                                    <div class="post-top">
                                        <div class="rewards">
                                            ${rewardUrl ? `<div class="rewards-text"><div>Incluye Premios<div class="icon-gift"></div></div></div>` : ''}
                                        </div>
                                    </div>
                                    <div class="meta-bottom">
                                        <div class="icon-arrow"></div>
                                        <div class="green-circle"></div>
                                    </div>
                                </a>
                            </div>
                        </div>`;
                
                    newsElement.appendChild(blockNews);

                    let fondoNews = blockNews.querySelector('.fondo-news');
                    let linkNews = blockNews.querySelectorAll('.fondo-news');

                    linkNews.forEach(linkNews => {
                        linkNews.addEventListener('click', e => {
                            shell.openExternal(e.target.dataset.url)
                        })
                    });

                    if (fondoNews && backgroundStyle) {
                        fondoNews.style.cssText = backgroundStyle;
                        console.log('Fondo de la noticia:', backgroundStyle);
                    }
                }            
            };
        } else {
            let blockNews = document.createElement('div');
            blockNews.classList.add('news-block');
            blockNews.innerHTML = `
                <div class="news-header">
                    <div class="header-text">
                        <div class="title-page">Error.</div>
                    </div>
                    <div class="date">
                        <div class="day"></div>
                        <div class="month"></div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>No se puede contactar con el servidor de noticias.</br>Por favor, reporte el problema a un desarrollador.</p>
                    </div>
                </div>`;
            newsElement.appendChild(blockNews);
        }
    }

    socialLick() {
        let socials = document.querySelectorAll('.social-block')

        socials.forEach(social => {
            social.addEventListener('click', e => {
                shell.openExternal(e.target.dataset.url)
            })
        });
    }

    async instancesSelect() {
        let configClient = await this.db.readData('configClient')
        let auth = await this.db.readData('accounts', configClient.account_selected)
        let instancesList = await config.getInstanceList()
        let instanceSelect = instancesList.find(i => i.name == configClient?.instance_selct) ? configClient?.instance_selct : null

        let instanceBTN = document.querySelector('.play-instance')
        let instancePopup = document.querySelector('.instance-popup')
        let instancesListPopup = document.querySelector('.instances-List')
        let instanceCloseBTN = document.querySelector('.close-popup')

        if (instancesList.length === 1) {
            document.querySelector('.instance-select').style.display = 'none'
            instanceBTN.style.paddingRight = '0'
        }

        if (!instanceSelect) {
            let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
            let configClient = await this.db.readData('configClient')
            configClient.instance_selct = newInstanceSelect.name
            instanceSelect = newInstanceSelect.name
            await this.db.updateData('configClient', configClient)
        }

        for (let instance of instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == auth?.name)
                if (whitelist !== auth?.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
                        let configClient = await this.db.readData('configClient')
                        configClient.instance_selct = newInstanceSelect.name
                        instanceSelect = newInstanceSelect.name
                        setStatus(newInstanceSelect.status)
                        await this.db.updateData('configClient', configClient)
                    }
                }
            } if (instance.name == instanceSelect) setStatus(instance.status)
        }

        instancePopup.addEventListener('click', async e => {
            let configClient = await this.db.readData('configClient')

            if (e.target.classList.contains('instance-elements')) {
                let newInstanceSelect = e.target.id
                let activeInstanceSelect = document.querySelector('.active-instance')

                if (activeInstanceSelect) activeInstanceSelect.classList.toggle('active-instance');
                e.target.classList.add('active-instance');

                configClient.instance_selct = newInstanceSelect
                await this.db.updateData('configClient', configClient)
                instanceSelect = instancesList.filter(i => i.name == newInstanceSelect)
                instancePopup.style.display = 'none'
                let instance = await config.getInstanceList()
                let options = instance.find(i => i.name == configClient.instance_selct)
                await setStatus(options.status)
            }
        })

        instanceBTN.addEventListener('click', async e => {
            let configClient = await this.db.readData('configClient')
            let instanceSelect = configClient.instance_selct
            let auth = await this.db.readData('accounts', configClient.account_selected)

            if (e.target.classList.contains('instance-select')) {
                instancesListPopup.innerHTML = ''
                for (let instance of instancesList) {
                    if (instance.whitelistActive) {
                        instance.whitelist.map(whitelist => {
                            if (whitelist == auth?.name) {
                                if (instance.name == instanceSelect) {
                                    instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`
                                } else {
                                    instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`
                                }
                            }
                        })
                    } else {
                        if (instance.name == instanceSelect) {
                            instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`
                        } else {
                            instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`
                        }
                    }
                }

                instancePopup.style.display = 'flex'
            }

            if (!e.target.classList.contains('instance-select')) this.startGame()
        })

        instanceCloseBTN.addEventListener('click', () => instancePopup.style.display = 'none')
    }

    async startGame() {
        let launch = new Launch()
        let configClient = await this.db.readData('configClient')
        let instance = await config.getInstanceList()
        let authenticator = await this.db.readData('accounts', configClient.account_selected)
        let options = instance.find(i => i.name == configClient.instance_selct)

        let playInstanceBTN = document.querySelector('.play-instance')
        let infoStartingBOX = document.querySelector('.info-starting-game')
        let infoStarting = document.querySelector(".info-starting-game-text")
        let progressBar = document.querySelector('.progress-bar')
        let fondo = document.querySelector('.fondo')

        let opt = {
            url: options.url,
            authenticator: authenticator,
            timeout: 10000,
            path: `${await appdata()}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
            instance: options.name,
            version: options.loadder.minecraft_version,
            detached: configClient.launcher_config.closeLauncher == "close-all" ? false : true,
            downloadFileMultiple: configClient.launcher_config.download_multi,
            intelEnabledMac: configClient.launcher_config.intelEnabledMac,

            loader: {
                type: options.loadder.loadder_type,
                build: options.loadder.loadder_version,
                enable: options.loadder.loadder_type == 'none' ? false : true
            },

            verify: options.verify,

            ignored: [...options.ignored],

            javaPath: configClient.java_config.java_path,

            screen: {
                width: configClient.game_config.screen_size.width,
                height: configClient.game_config.screen_size.height
            },

            memory: {
                min: `${configClient.java_config.java_memory.min * 1024}M`,
                max: `${configClient.java_config.java_memory.max * 1024}M`
            }
        }

        launch.Launch(opt);

        playInstanceBTN.style.display = "none"
        infoStartingBOX.style.display = "block"
        progressBar.style.display = "";
        fondo.style.display = "none"
        ipcRenderer.send('main-window-progress-load')

        launch.on('extract', extract => {
            ipcRenderer.send('main-window-progress-load')
        });

        launch.on('progress', (progress, size) => {
            infoStarting.innerHTML = `Descargando ${((progress / size) * 100).toFixed(0)}%`
            ipcRenderer.send('main-window-progress', { progress, size })
        });

        launch.on('check', (progress, size) => {
            infoStarting.innerHTML = `Verificando ${((progress / size) * 100).toFixed(0)}%`
            ipcRenderer.send('main-window-progress', { progress, size })
        });

        launch.on('estimated', (time) => {
            let hours = Math.floor(time / 3600);
            let minutes = Math.floor((time - hours * 3600) / 60);
            let seconds = Math.floor(time - hours * 3600 - minutes * 60);
            console.log(`${hours}h ${minutes}m ${seconds}s`);
        })

        launch.on('speed', (speed) => {
            console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
        })

        launch.on('patch', patch => {
            console.log(patch);
            ipcRenderer.send('main-window-progress-load')
            infoStarting.innerHTML = `Parche en curso...`
        });

        launch.on('data', (e) => {
            progressBar.style.display = "none"
            if (configClient.launcher_config.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-hide")
            };
            new logger('Minecraft', '#36b030');
            ipcRenderer.send('main-window-progress-load')
            infoStarting.innerHTML = `Puesta en marcha...`
            console.log(e);
        })

        launch.on('close', code => {
            if (configClient.launcher_config.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-show")
            };
            ipcRenderer.send('main-window-progress-reset')
            infoStartingBOX.style.display = "none"
            playInstanceBTN.style.display = "flex"
            infoStarting.innerHTML = `Verificando`
            new logger(pkg.name, '#7289da');
            console.log('Close');
        });

        launch.on('error', err => {
            let popupError = new popup()

            popupError.openPopup({
                title: 'Error',
                content: err.error,
                color: 'red',
                options: true
            })

            if (configClient.launcher_config.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-show")
            };
            ipcRenderer.send('main-window-progress-reset')
            infoStartingBOX.style.display = "none"
            playInstanceBTN.style.display = "flex"
            infoStarting.innerHTML = `Verificando`
            new logger(pkg.name, '#7289da');
            console.log(err);
        });
    }
}
export default Home;