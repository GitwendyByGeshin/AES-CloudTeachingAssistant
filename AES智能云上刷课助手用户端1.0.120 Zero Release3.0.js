// ==UserScript== 
// @name         AES云上授课助手 
// @namespace    https://scriptcat.org/ 
// @version      1.0.120-DevPreview 3
// @description  AES云上授课助手1.0.120开发灰度预览版3.0 - 针对出头科技云上教学系统的自动刷课脚本 
// @Tag          网课自动化
// @author       绫白 
// @match        https://csjs.web2.superchutou.com/* 
// @match        https://*.superchutou.com/* 
// @grant        GM_notification 
// @grant        GM_log 
// @grant        GM_getValue 
// @grant        GM_setValue 
// @grant        GM_registerMenuCommand 
// @grant        GM_addStyle 
// @run-at       document-end 
// @license      MIT 
// ==/UserScript== 

(function() { 
'use strict'; 

// ==================== 配置项 ==================== 
const CONFIG = { 
    playbackRate: 1.5, 
    autoMute: true, 
    enableBackgroundPlay: true, 
    checkInterval: 2000, 
    startWaitTime: 2000, 
    nextVideoDelay: 2000, 
    showNotification: true, 
    debug: true 
}; 

// ==================== 工具函数 ==================== 
function log(message, type = 'info') { 
    const prefix = '[AES助手]'; 
    const timestamp = new Date().toLocaleTimeString(); 
    const fullMessage = `${prefix} [${timestamp}] ${message}`; 
    if (CONFIG.debug) { 
        const styles = { 
            info: 'color: #2196F3', 
            success: 'color: #4CAF50', 
            warn: 'color: #FF9800', 
            error: 'color: #F44336' 
        }; 
        console.log(`%c${fullMessage}`, styles[type] || styles.info); 
    } 
    GM_log(fullMessage, type); 
} 

function notify(title, text, timeout = 5000) { 
    if (CONFIG.showNotification) GM_notification({ title, text, timeout }); 
    log(`${title}: ${text}`, 'success'); 
} 

// ==================== 独立矢量LOGO (防ID冲突) ==================== 
const LOGO_SVG = `<svg class="aes-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.319 19.5C4.289 19.5 2.645 17.857 2.645 15.826C2.645 14.2 3.713 12.82 5.19 12.336C5.068 11.818 5 11.278 5 10.723C5 7.412 7.686 4.726 10.997 4.726C13.632 4.726 15.861 6.417 16.672 8.777C16.882 8.726 17.102 8.7 17.328 8.7C19.358 8.7 21 10.342 21 12.373C21 12.874 20.897 13.351 20.71 13.784C21.496 14.243 22 15.09 22 16.055C22 17.406 20.905 18.5 19.555 18.5" stroke="url(#aes-grad1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 16L15 12.5L10 9V16Z" fill="url(#aes-grad2)"/>
  <path d="M7.5 10.5L9 11.5" stroke="#4facfe" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <defs>
    <linearGradient id="aes-grad1" x1="2.645" y1="4.726" x2="22" y2="19.5" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4facfe"/>
      <stop offset="1" stop-color="#764ba2"/>
    </linearGradient>
    <linearGradient id="aes-grad2" x1="10" y1="9" x2="15" y2="16" gradientUnits="userSpaceOnUse">
      <stop stop-color="#667eea"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
</svg>`;

// ==================== 全局CSS提取 (解决CSP拦截) ==================== 
const PANEL_CSS = ` 
#aes-panel { 
    position: fixed; 
    top: 80px; 
    right: 20px; 
    width: 320px; 
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
    border-radius: 16px; 
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); 
    z-index: 999999; 
    font-family: '汉仪文黑85W', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    color: #fff; 
    overflow: hidden; 
    transition: all 0.3s ease; 
    user-select: none; 
} 
#aes-panel.collapsed { 
    width: 50px; 
    height: 50px; 
    border-radius: 50%; 
    cursor: pointer; 
} 
#aes-panel.collapsed .panel-content { display: none; } 
#aes-panel.collapsed .panel-header { 
    padding: 0; 
    justify-content: center; 
    border-radius: 50%; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
} 
#aes-panel.collapsed .panel-title { display: none; } 
#aes-panel.collapsed .toggle-btn { display: none; } 
#aes-panel.collapsed .collapsed-icon { display: flex !important; } 
.aes-logo { 
    vertical-align: middle; 
    margin-right: 6px; 
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); 
} 
#aes-panel.collapsed .aes-logo { 
    width: 26px; 
    height: 26px; 
    margin: 0; 
} 
.panel-header { 
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); 
    padding: 12px 16px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    cursor: move; 
} 
.panel-title { 
    font-size: 14px; 
    font-weight: 600; 
    display: flex; 
    align-items: center; 
} 
.collapsed-icon { 
    display: none; 
    align-items: center; 
    justify-content: center; 
    width: 100%; 
    height: 100%; 
} 
.toggle-btn { 
    background: rgba(255,255,255,0.2); 
    border: none; 
    color: #fff; 
    width: 24px; 
    height: 24px; 
    border-radius: 8px; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    transition: all 0.2s; 
    font-size: 16px; 
    line-height: 1; 
} 
.toggle-btn:hover { background: rgba(255,255,255,0.3); } 
.panel-content { padding: 16px; } 
.status-card { 
    background: rgba(255,255,255,0.08); 
    border-radius: 12px; 
    padding: 12px; 
    margin-bottom: 12px; 
} 
.status-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 8px; 
} 
.status-label { font-size: 12px; color: #888; } 
.status-value { 
    font-size: 13px; 
    font-weight: 500; 
    display: flex; 
    align-items: center; 
    gap: 4px; 
} 
.status-running { color: #4CAF50; } 
.status-stopped { color: #ff9800; } 
.status-dot { 
    width: 8px; 
    height: 8px; 
    border-radius: 50%; 
    background: #4CAF50; 
    animation: pulse 1.5s infinite; 
} 
.status-dot.stopped { background: #ff9800; animation: none; } 
@keyframes pulse { 
    0%, 100% { opacity: 1; } 
    50% { opacity: 0.5; } 
} 
.progress-bar { 
    height: 6px; 
    background: rgba(255,255,255,0.1); 
    border-radius: 3px; 
    overflow: hidden; 
    margin: 8px 0; 
} 
.progress-fill { 
    height: 100%; 
    background: linear-gradient(90deg, #4CAF50, #8BC34A); 
    border-radius: 3px; 
    transition: width 0.3s ease; 
} 
.progress-text { 
    display: flex; 
    justify-content: space-between; 
    font-size: 11px; 
    color: #888; 
} 
.video-info { 
    background: rgba(255,255,255,0.05); 
    border-radius: 8px; 
    padding: 10px; 
    margin-top: 8px; 
} 
.video-title { 
    font-size: 13px; 
    font-weight: 500; 
    margin-bottom: 4px; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
} 
.video-index { font-size: 11px; color: #888; } 
.control-grid { 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 8px; 
    margin-bottom: 12px; 
} 
.ctrl-btn { 
    background: rgba(255,255,255,0.1); 
    border: none; 
    color: #fff; 
    padding: 10px 6px; 
    border-radius: 10px; 
    cursor: pointer; 
    transition: all 0.2s; 
    font-size: 16px; 
} 
.ctrl-btn:hover { 
    background: rgba(255,255,255,0.2); 
    transform: translateY(-1px); 
} 
.ctrl-btn.active { background: linear-gradient(135deg, #4CAF50, #8BC34A); } 
.ctrl-btn:disabled { opacity: 0.5; cursor: not-allowed; } 
.speed-section { margin-bottom: 12px; } 
.speed-header { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 8px; 
    font-size: 12px; 
} 
.speed-current { color: #667eea; font-weight: 600; } 
.speed-buttons { display: flex; gap: 6px; } 
.speed-btn { 
    flex: 1; 
    background: rgba(255,255,255,0.1); 
    border: none; 
    color: #fff; 
    padding: 8px 4px; 
    border-radius: 8px; 
    cursor: pointer; 
    font-size: 12px; 
    transition: all 0.2s; 
} 
.speed-btn:hover { background: rgba(255,255,255,0.2); } 
.speed-btn.active { background: linear-gradient(135deg, #667eea, #764ba2); } 
.stats-row { 
    display: flex; 
    justify-content: space-around; 
    padding: 12px 0; 
    border-top: 1px solid rgba(255,255,255,0.1); 
} 
.stat-item { text-align: center; } 
.stat-value { 
    font-size: 18px; 
    font-weight: 600; 
    color: #fff; 
} 
.stat-label { 
    font-size: 10px; 
    color: #888; 
    margin-top: 2px; 
} 
.stat-value.highlight { color: #4CAF50; } 
.footer-credit { 
    text-align: center; 
    padding: 10px 0 6px; 
    border-top: 1px solid rgba(255,255,255,0.08); 
    margin-top: 8px; 
} 
.footer-credit-text { 
    font-size: 10px; 
    color: #555; 
    line-height: 1.5; 
} 
.footer-credit-text span { 
    color: #4facfe; 
    font-weight: bold; 
} 
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) { 
    #aes-panel { 
        -webkit-font-smoothing: antialiased; 
        -moz-osx-font-smoothing: grayscale; 
    } 
    .stats-row, 
    .footer-credit { 
        border-top: none; 
        position: relative; 
    } 
    .stats-row::after, 
    .footer-credit::after { 
        content: ''; 
        position: absolute; 
        left: 0; 
        top: 0; 
        width: 200%; 
        height: 200%; 
        transform-origin: 0 0; 
        transform: scale(0.5); 
        pointer-events: none; 
        box-sizing: border-box; 
    } 
    .stats-row::after { border-top: 1px solid rgba(255,255,255,0.1); } 
    .footer-credit::after { border-top: 1px solid rgba(255,255,255,0.08); } 
} 
`; 

// ==================== UI面板类 ==================== 
class ControlPanel { 
    constructor(manager) { 
        this.manager = manager; 
        this.panel = null; 
        this.isCollapsed = false; 
        this.isDragging = false; 
        this.dragOffset = { x: 0, y: 0 }; 
        this.updateTimer = null; 
        this.init(); 
    } 
    
    init() { 
        GM_addStyle(PANEL_CSS); 
        this.createPanel(); 
        this.bindEvents(); 
        this.startUpdate(); 
        log('控制面板已创建(安全模式)', 'success'); 
    } 
    
    createPanel() { 
        const container = document.createElement('div'); 
        container.id = 'aes-panel-container'; 
        container.innerHTML = ` 
        <div id="aes-panel"> 
            <div class="panel-header"> 
                <span class="panel-title">${LOGO_SVG}AES云上授课助手</span> 
                <span class="collapsed-icon">${LOGO_SVG}</span> 
                <button class="toggle-btn" id="toggle-btn">−</button> 
            </div> 
            <div class="panel-content"> 
                <div class="status-card"> 
                    <div class="status-header"> 
                        <span class="status-label">运行状态</span> 
                        <span class="status-value status-running" id="status-text"> 
                            <span class="status-dot" id="status-dot"></span> 
                            <span id="status-label">运行中</span> 
                        </span> 
                    </div> 
                    <div class="progress-bar"> 
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div> 
                    </div> 
                    <div class="progress-text"> 
                        <span id="current-time">00:00</span> 
                        <span id="progress-percent">0%</span> 
                        <span id="total-time">00:00</span> 
                    </div> 
                    <div class="video-info"> 
                        <div class="video-title" id="video-title">加载中...</div> 
                        <div class="video-index" id="video-index">第 0/0 个视频</div> 
                    </div> 
                </div> 
                <div class="control-grid"> 
                    <button class="ctrl-btn active" id="btn-play" title="播放/暂停">▶</button> 
                    <button class="ctrl-btn" id="btn-prev" title="上一课">⏮</button> 
                    <button class="ctrl-btn" id="btn-next" title="下一课">⏭</button> 
                    <button class="ctrl-btn" id="btn-mute" title="静音">🔊</button> 
                </div> 
                <div class="speed-section"> 
                    <div class="speed-header"> 
                        <span>播放速度</span> 
                        <span class="speed-current" id="speed-display">1.5x</span> 
                    </div> 
                    <div class="speed-buttons"> 
                        <button class="speed-btn" data-speed="1">1x</button> 
                        <button class="speed-btn" data-speed="1.25">1.25x</button> 
                        <button class="speed-btn active" data-speed="1.5">1.5x</button> 
                        <button class="speed-btn" data-speed="2">2x</button> 
                        <button class="speed-btn" data-speed="3">3x</button> 
                    </div> 
                </div> 
                <div class="stats-row"> 
                    <div class="stat-item"> 
                        <div class="stat-value highlight" id="stat-completed">0</div> 
                        <div class="stat-label">已完成</div> 
                    </div> 
                    <div class="stat-item"> 
                        <div class="stat-value" id="stat-remaining">0</div> 
                        <div class="stat-label">剩余</div> 
                    </div> 
                    <div class="stat-item"> 
                        <div class="stat-value" id="stat-percent">0%</div> 
                        <div class="stat-label">总进度</div> 
                    </div> 
                </div> 
                <div class="footer-credit"> 
                    <div class="footer-credit-text">由<span>智谱清言</span>与<span>ScriptCat</span>及创作者<span>绫白</span>共同驱动</div> 
                </div> 
            </div> 
        </div> 
        `; 
        document.body.appendChild(container); 
        this.panel = document.getElementById('aes-panel'); 
    } 
    
    bindEvents() { 
        document.getElementById('toggle-btn').addEventListener('click', (e) => { 
            e.stopPropagation(); 
            this.toggleCollapse(); 
        }); 
        
        this.panel.querySelector('.panel-header').addEventListener('dblclick', () => this.toggleCollapse()); 
        
        const header = this.panel.querySelector('.panel-header'); 
        header.addEventListener('mousedown', (e) => { 
            if (this.isCollapsed) return; 
            this.isDragging = true; 
            const rect = this.panel.getBoundingClientRect(); 
            this.dragOffset.x = e.clientX - rect.left; 
            this.dragOffset.y = e.clientY - rect.top; 
            this.panel.style.transition = 'none'; 
        }); 
        
        document.addEventListener('mousemove', (e) => { 
            if (!this.isDragging) return; 
            this.panel.style.left = Math.max(0, e.clientX - this.dragOffset.x) + 'px'; 
            this.panel.style.top = Math.max(0, e.clientY - this.dragOffset.y) + 'px'; 
            this.panel.style.right = 'auto'; 
        }); 
        
        document.addEventListener('mouseup', () => { 
            this.isDragging = false; 
            this.panel.style.transition = ''; 
        }); 
        
        document.getElementById('btn-play').addEventListener('click', () => this.manager.togglePlay()); 
        document.getElementById('btn-prev').addEventListener('click', () => this.manager.playPrevVideo()); 
        document.getElementById('btn-next').addEventListener('click', () => this.manager.playNextVideo()); 
        document.getElementById('btn-mute').addEventListener('click', () => this.manager.toggleMute()); 
        
        document.querySelectorAll('.speed-btn').forEach(btn => { 
            btn.addEventListener('click', () => { 
                const speed = parseFloat(btn.dataset.speed); 
                this.manager.setSpeed(speed); 
                this.updateSpeedButtons(speed); 
            }); 
        }); 
    } 
    
    toggleCollapse() { 
        this.isCollapsed = !this.isCollapsed; 
        this.panel.classList.toggle('collapsed', this.isCollapsed); 
        document.getElementById('toggle-btn').textContent = this.isCollapsed ? '+' : '−'; 
    } 
    
    updateSpeedButtons(speed) { 
        document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed)); 
        document.getElementById('speed-display').textContent = speed + 'x'; 
    } 
    
    startUpdate() { 
        this.updateTimer = setInterval(() => this.updateDisplay(), 500); 
    } 
    
    updateDisplay() { 
        const video = this.manager.video; 
        if (!video) return; 
        
        const currentTime = video.currentTime || 0; 
        const duration = video.duration || 0; 
        const progress = duration > 0 ? (currentTime / duration * 100) : 0; 
        const isPaused = video.paused; 
        
        const statusDot = document.getElementById('status-dot'); 
        const statusLabel = document.getElementById('status-label'); 
        const playBtn = document.getElementById('btn-play'); 
        
        if (isPaused) { 
            statusDot.classList.add('stopped'); 
            statusLabel.textContent = '已暂停'; 
            playBtn.textContent = '▶'; 
            playBtn.classList.remove('active'); 
        } else { 
            statusDot.classList.remove('stopped'); 
            statusLabel.textContent = '运行中'; 
            playBtn.textContent = '⏸'; 
            playBtn.classList.add('active'); 
        } 
        
        document.getElementById('progress-fill').style.width = progress + '%'; 
        document.getElementById('current-time').textContent = this.manager.formatTime(currentTime); 
        document.getElementById('total-time').textContent = this.manager.formatTime(duration); 
        document.getElementById('progress-percent').textContent = progress.toFixed(0) + '%'; 
        
        const videoItems = this.manager.getAllVideoItems(); 
        const total = videoItems.length; 
        
        const safeIndex = Math.max(0, this.manager.currentVideoIndex);
        const displayCurrentIndex = Math.max(1, this.manager.currentVideoIndex + 1);
        
        if (videoItems[this.manager.currentVideoIndex]) { 
            document.getElementById('video-title').textContent = videoItems[this.manager.currentVideoIndex].textContent?.trim().split('时长')[0] || ''; 
        } 
        document.getElementById('video-index').textContent = `第 ${displayCurrentIndex}/${total} 个视频`; 
        
        document.getElementById('stat-completed').textContent = safeIndex; 
        document.getElementById('stat-remaining').textContent = Math.max(0, total - safeIndex); 
        document.getElementById('stat-percent').textContent = total > 0 ? ((safeIndex / total) * 100).toFixed(0) + '%' : '0%'; 
        
        const muteBtn = document.getElementById('btn-mute'); 
        muteBtn.textContent = video.muted ? '🔇' : '🔊'; 
        muteBtn.classList.toggle('active', video.muted); 
    } 
    
    destroy() { 
        if (this.updateTimer) clearInterval(this.updateTimer); 
        document.getElementById('aes-panel-container')?.remove(); 
    } 
} 

// ==================== 核心管理类 ==================== 
class AutoPlayManager { 
    constructor() { 
        this.video = null; 
        this.isPlaying = false; 
        this.isCompleted = false; 
        this.checkTimer = null; 
        this.currentVideoIndex = -1; 
        this.totalVideos = 0; 
        this.panel = null; 
        this.observer = null; 
        this.init(); 
    } 
    
    init() { 
        log('AES智能云上刷课助手 v1.0.120 [开发灰度预览版] 启动', 'info'); 
        const savedRate = GM_getValue('playbackRate'); 
        if (savedRate) CONFIG.playbackRate = savedRate; 
        const savedMute = GM_getValue('autoMute'); 
        if (savedMute !== undefined) CONFIG.autoMute = savedMute; 
        
        this.registerMenuCommands(); 
        if (CONFIG.enableBackgroundPlay) this.setupAntiPause(); 
        this.setupRouteListener(); 
        
        this.panel = new ControlPanel(this); 
        this.tryInitPlayer(); 
    } 
    
    registerMenuCommands() { 
        // 【BUG修复】弃用箭头函数与首字符Emoji，使用 .bind(this) 强绑定上下文防止沙箱剥离
        GM_registerMenuCommand('开始/暂停', this.togglePlay.bind(this)); 
        GM_registerMenuCommand('下一课', this.playNextVideo.bind(this)); 
        GM_registerMenuCommand('查看进度', this.showProgress.bind(this)); 
    } 
    
    setupAntiPause() { 
        try { 
            Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); 
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true }); 
        } catch (e) {} 
        
        const forcePlay = () => { 
            if (this.video && this.isPlaying && this.video.paused && !this.video.ended) { 
                this.video.play().catch(() => {}); 
            } 
        }; 
        document.addEventListener('visibilitychange', forcePlay); 
        window.addEventListener('blur', forcePlay); 
        document.addEventListener('mouseleave', forcePlay); 
    } 
    
    setupRouteListener() { 
        let lastHash = location.hash; 
        window.addEventListener('hashchange', () => { 
            if (location.hash !== lastHash) { 
                lastHash = location.hash; 
                log('页面切换: ' + location.hash, 'info'); 
                this.onRouteChange(); 
            } 
        }); 
    } 
    
    onRouteChange() { 
        this.isCompleted = false; 
        this.isPlaying = false; 
        this.currentVideoIndex = -1; 
        if (this.checkTimer) { 
            clearInterval(this.checkTimer); 
            this.checkTimer = null; 
        } 
        if (this.observer) { 
            this.observer.disconnect(); 
            this.observer = null; 
        } 
        setTimeout(() => { 
            this.updateCurrentVideoIndex(); 
            this.tryInitPlayer(); 
        }, 2000); 
    } 
    
    getAllVideoItems() { 
        return Array.from(document.querySelectorAll('ul.ant-list-items > div > a')); 
    } 
    
    getCurrentVideoId() { 
        const match = location.hash.match(/#\/video\/([^/]+)/); 
        return match ? match[1] : null; 
    } 
    
    updateCurrentVideoIndex() { 
        const videoItems = this.getAllVideoItems(); 
        const currentId = this.getCurrentVideoId(); 
        this.totalVideos = videoItems.length; 
        if (currentId) { 
            videoItems.forEach((item, index) => { 
                if ((item.getAttribute('href') || '').includes(currentId)) this.currentVideoIndex = index; 
            }); 
        } 
        log(`当前视频索引: ${this.currentVideoIndex + 1}/${this.totalVideos}`, 'info'); 
    } 
    
    tryInitPlayer() { 
        if (!location.hash.includes('/video/')) return; 
        log('正在查找视频播放器...', 'info'); 
        
        const findVideo = () => { 
            let v = document.querySelector('#CuPlayer video') || document.querySelector('.vjs-tech') || document.querySelector('video'); 
            if (!v) { 
                try { 
                    const iframes = document.querySelectorAll('iframe'); 
                    for (let iframe of iframes) { 
                        if (iframe.contentDocument) { 
                            v = iframe.contentDocument.querySelector('video'); 
                            if (v) break; 
                        } 
                    } 
                } catch (e) {} 
            } 
            return v; 
        }; 
        
        if (findVideo()) { 
            this.video = findVideo(); 
            this.onPlayerReady(); 
            return; 
        } 
        
        this.observer = new MutationObserver((mutations, obs) => { 
            const v = findVideo(); 
            if (v) { 
                obs.disconnect(); 
                this.observer = null; 
                this.video = v; 
                this.onPlayerReady(); 
            } 
        }); 
        
        this.observer.observe(document.body, { childList: true, subtree: true }); 
        
        setTimeout(() => { 
            if (this.observer) { 
                this.observer.disconnect(); 
                this.observer = null; 
                if (!this.video) log('未找到视频播放器(超时)', 'error'); 
            } 
        }, 15000); 
    } 
    
    onPlayerReady() { 
        log('视频播放器已就绪', 'success'); 
        this.updateCurrentVideoIndex(); 
        this.lockPlaybackRate(this.video); 
        if (CONFIG.autoMute) this.video.muted = true; 
        this.setupVideoEvents(); 
        setTimeout(() => this.startAutoPlay(), CONFIG.startWaitTime); 
    } 
    
    lockPlaybackRate(videoElement) { 
        try { 
            Object.defineProperty(HTMLVideoElement.prototype, 'playbackRate', { 
                get: function() { return this._aes_rate || 1.0; }, 
                set: function(val) { 
                    if (this._aes_setting) { 
                        this._aes_rate = val; 
                        this._aes_setting = false; 
                    } else { 
                        this._aes_rate = CONFIG.playbackRate; 
                    } 
                    Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate').set.call(this, this._aes_rate); 
                }, 
                configurable: true 
            }); 
            videoElement._aes_setting = true; 
            videoElement.playbackRate = CONFIG.playbackRate; 
            log(`已启用倍速防护锁: ${CONFIG.playbackRate}x`, 'success'); 
        } catch (e) { 
            log('倍速防护锁安装失败，启用降级防护', 'warn'); 
            videoElement.addEventListener('ratechange', () => { 
                if (Math.abs(videoElement.playbackRate - CONFIG.playbackRate) > 0.01) { 
                    videoElement.playbackRate = CONFIG.playbackRate; 
                } 
            }); 
            videoElement.playbackRate = CONFIG.playbackRate; 
        } 
    } 
    
    applyPlaybackRate() { 
        if (this.video) { 
            this.video._aes_setting = true; 
            this.video.playbackRate = CONFIG.playbackRate; 
        } 
    } 
    
    setupVideoEvents() { 
        if (!this.video) return; 
        this.video.addEventListener('play', () => { this.isPlaying = true; }); 
        this.video.addEventListener('pause', () => { 
            if (!this.video.ended && this.isPlaying) { 
                setTimeout(() => { 
                    if (this.video && this.video.paused && !this.video.ended) this.video.play().catch(() => {}); 
                }, 300); 
            } 
        }); 
        this.video.addEventListener('ended', () => this.onVideoEnded()); 
        this.video.addEventListener('error', () => { 
            log('视频播放错误，尝试重载', 'error'); 
            setTimeout(() => { 
                if (this.video) { 
                    this.video.load(); 
                    this.video.play().catch(() => {}); 
                } 
            }, 3000); 
        }); 
    } 
    
    startAutoPlay() { 
        if (!this.video) { 
            this.tryInitPlayer(); 
            return; 
        } 
        this.applyPlaybackRate(); 
        if (CONFIG.autoMute) this.video.muted = true; 
        
        this.video.play().then(() => { 
            this.isPlaying = true; 
            notify('刷课已开始', `第 ${this.currentVideoIndex + 1}/${this.getAllVideoItems().length} 个视频`); 
            this.startStatusCheck(); 
        }).catch(err => { 
            log('自动播放失败，强制静音重试: ' + err.message, 'error'); 
            this.video.muted = true; 
            this.video.play().catch(() => log('请手动点击播放一次以激活', 'error')); 
        }); 
    } 
    
    stopAutoPlay() { 
        if (this.checkTimer) { 
            clearInterval(this.checkTimer); 
            this.checkTimer = null; 
        } 
        if (this.video) this.video.pause(); 
        this.isPlaying = false; 
        notify('刷课已停止', '脚本已暂停运行'); 
    } 
    
    togglePlay() { 
        if (this.video) this.video.paused ? this.video.play().catch(() => {}) : this.video.pause(); 
    } 
    
    toggleMute() { 
        if (!this.video) return; 
        this.video.muted = !this.video.muted; 
        CONFIG.autoMute = this.video.muted; 
        GM_setValue('autoMute', CONFIG.autoMute); 
    } 
    
    setSpeed(speed) { 
        CONFIG.playbackRate = speed; 
        GM_setValue('playbackRate', speed); 
        this.applyPlaybackRate(); 
        notify('速度已设置', `播放速度: ${speed}x`); 
    } 
    
    startStatusCheck() { 
        if (this.checkTimer) clearInterval(this.checkTimer); 
        this.checkTimer = setInterval(() => this.checkVideoStatus(), CONFIG.checkInterval); 
    } 
    
    checkVideoStatus() { 
        if (!this.video) { 
            this.tryInitPlayer(); 
            return; 
        } 
        if (this.video.paused && !this.video.ended && this.isPlaying) this.video.play().catch(() => {}); 
    } 
    
    onVideoEnded() { 
        if (this.isCompleted) return; 
        this.isCompleted = true; 
        log('视频播放完成！', 'success'); 
        notify('课程已完成', `第 ${this.currentVideoIndex + 1}/${this.getAllVideoItems().length} 个视频播放完成`); 
        
        if (this.checkTimer) { 
            clearInterval(this.checkTimer); 
            this.checkTimer = null; 
        } 
        setTimeout(() => this.playNextVideo(), CONFIG.nextVideoDelay); 
    } 
    
    playNextVideo() { 
        this.updateCurrentVideoIndex(); 
        const videoItems = this.getAllVideoItems(); 
        if (videoItems.length === 0) { 
            notify('切换失败', '未找到课程目录'); 
            return; 
        } 
        
        const nextIndex = this.currentVideoIndex + 1; 
        if (nextIndex >= videoItems.length) { 
            notify('🎉 刷课完成！', '所有视频已播放完毕'); 
            return; 
        } 
        
        const nextVideo = videoItems[nextIndex]; 
        const videoName = nextVideo.textContent?.trim().split('时长')[0] || `第${nextIndex + 1}个视频`; 
        
        let currentHash = location.hash; 
        nextVideo.click(); 
        
        setTimeout(() => { 
            if (location.hash === currentHash) { 
                const href = nextVideo.getAttribute('href'); 
                if (href) { 
                    log('点击切换失效，执行强制Hash跳转', 'warn'); 
                    location.hash = href; 
                } 
            } 
        }, 500); 
        
        notify('切换视频', `正在播放: ${videoName}`); 
        this.isCompleted = false; 
        this.isPlaying = false; 
        this.video = null; 
        
        setTimeout(() => { 
            this.updateCurrentVideoIndex(); 
            this.tryInitPlayer(); 
        }, 3000); 
    } 
    
    playPrevVideo() { 
        this.updateCurrentVideoIndex(); 
        const videoItems = this.getAllVideoItems(); 
        if (videoItems.length === 0) return; 
        
        const prevIndex = this.currentVideoIndex - 1; 
        if (prevIndex < 0) { 
            notify('提示', '已经是第一个视频了'); 
            return; 
        } 
        
        const prevVideo = videoItems[prevIndex]; 
        let currentHash = location.hash; 
        prevVideo.click(); 
        
        setTimeout(() => { 
            if (location.hash === currentHash) { 
                const href = prevVideo.getAttribute('href'); 
                if (href) location.hash = href; 
            } 
        }, 500); 
        
        this.isCompleted = false; 
        this.isPlaying = false; 
        this.video = null; 
        
        setTimeout(() => { 
            this.updateCurrentVideoIndex(); 
            this.tryInitPlayer(); 
        }, 3000); 
    } 
    
    showProgress() { 
        const videoItems = this.getAllVideoItems(); 
        this.updateCurrentVideoIndex(); 
        const current = this.currentVideoIndex + 1; 
        const total = videoItems.length; 
        const percent = total > 0 ? ((current / total) * 100).toFixed(1) : 0; 
        let timeInfo = this.video ? `\n当前: ${this.formatTime(this.video.currentTime)} / ${this.formatTime(this.video.duration)}` : ''; 
        notify('当前进度', `第 ${current}/${total} 个视频 (${percent}%)${timeInfo}`); 
    } 
    
    formatTime(seconds) { 
        if (!seconds || isNaN(seconds)) return '00:00'; 
        const h = Math.floor(seconds / 3600); 
        const m = Math.floor((seconds % 3600) / 60); 
        const s = Math.floor(seconds % 60); 
        return h > 0 ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; 
    } 
} 

// ==================== 启动 ==================== 
if (document.readyState === 'complete') { 
    new AutoPlayManager(); 
} else { 
    window.addEventListener('load', () => new AutoPlayManager()); 
} 
})();
