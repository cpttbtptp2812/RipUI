// ==UserScript==
// @name         Boss直聘自动打招呼与智能投递（王旭-全栈/AI Agent定制版）
// @namespace    http://tampermonkey.net/
// @version      3.8.2
// @description  全自动智能打招呼、强力穿透切回期望Tab(绝不投推荐)、公司黑名单精准屏蔽、页面防重置拦截、杭州/广州/苏州三城接力锁定、5-15秒真随机防封冷却(跨页持久+实时倒计时面板)、图2详情页立即沟通前坐标级物理绝杀、聊天页终极安检门闩
// @author       Antigravity & WangXu
// @match        https://www.zhipin.com/web/geek/*
// @include      https://www.zhipin.com/web/geek/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ── 默认配置（基于王旭 9年全栈 + AI Agent 简历专属定制） ──
    const NEW_GREETING = `9年前端全栈，主栈 React / Vue / TS，带过 4–5 人小组，近两年主要在做 AI Agent。自研过全双工 SSE Agent Loop（多轮状态机、增量解析、防死循环熔断），深入接入 MCP 和 Tool Calling，高危写操作走 2PC 人机审批门闩防误操作；用 React Flow 做过复杂工作流编排，做过混合 RAG、Trace 全链路观测与发版评测门禁。后端精通 Java Spring Boot 和 Node，Docker 独立上线部署，做过可公开体验的完整平台：https://ownagent.com.cn/`;

    const DEFAULT_CONFIG = {
        greetingMessage: NEW_GREETING,
        minSalaryK: 16,               // 最低薪资过滤（最高低于16K才跳过）
        maxSalaryK: 26,               // 薪资严格上限（只要岗位最高高于此值坚决拦截，默认26K）
        maxGreetCountPerDay: 70,       // 单日最大打招呼上限
        minDelaySec: 5,                // 最小随机延迟（秒，投递后随机等待5-15秒防封）
        maxDelaySec: 15,               // 最大随机延迟（秒）
        autoNextPage: true,            // 列表到底后自动下拉加载更多职位

        // 📍 目标城市白名单（支持 杭州 / 广州 / 苏州）
        targetCities: [
            "杭州", "广州", "苏州"
        ],

        // 🎯 目标岗位关键词白名单
        targetJobKeywords: [
            "前端", "全栈", "agent", "ai", "react", "typescript", "ts", "web", "java", "node", "架构", "软件", "开发", "工程师"
        ],

        // 🚫 排除黑名单关键词（岗位标题中包含则跳过）
        excludeKeywords: [
            "产品", "销售", "设计", "施工", "文员", "客服", "运营", "实习", "应届", "校招", "兼职", "无责", "电话销售", "外呼", "驻场外包", "外派"
        ],

        // 🚫 排除屏蔽公司黑名单（公司名命中则坚决不投）
        excludeCompanies: [
            "天阳", "软通", "汇合", "中软", "博彦", "法本", "诚迈", "微创", "文思海辉", "太平洋人寿", "平安人寿", "中国人寿"
        ]
    };

    let savedConfig = GM_getValue("boss_auto_config", {});
    savedConfig.greetingMessage = NEW_GREETING;
    if (!savedConfig.targetCities || savedConfig.targetCities.length === 0) {
        savedConfig.targetCities = ["杭州", "广州", "苏州"];
    } else {
        // 自动补齐苏州
        if (!savedConfig.targetCities.includes("苏州")) {
            savedConfig.targetCities.push("苏州");
        }
    }
    if (typeof savedConfig.maxSalaryK === 'undefined' || savedConfig.maxSalaryK === 0) {
        savedConfig.maxSalaryK = 26;
    }
    if (!savedConfig.excludeCompanies || savedConfig.excludeCompanies.length === 0) {
        savedConfig.excludeCompanies = DEFAULT_CONFIG.excludeCompanies;
    }
    // 强制迁移更新：投完后随机等待 5-15 秒（防封安全策略）
    if (typeof savedConfig.minDelaySec !== 'number' || savedConfig.minDelaySec < 1) {
        savedConfig.minDelaySec = 5;
    }
    if (typeof savedConfig.maxDelaySec !== 'number' || savedConfig.maxDelaySec < savedConfig.minDelaySec) {
        savedConfig.maxDelaySec = 15;
    }
    let CONFIG = Object.assign({}, DEFAULT_CONFIG, savedConfig);
    GM_setValue("boss_auto_config", CONFIG);

    function getTodayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // ── 检查公司名是否命中黑名单 ──
    function isCompanyBlocked(companyName) {
        if (!companyName) return false;
        const cName = companyName.trim().toLowerCase();
        const list = CONFIG.excludeCompanies || [];
        for (const blocked of list) {
            const b = blocked.trim().toLowerCase();
            if (b && cName.includes(b)) {
                return b;
            }
        }
        return false;
    }

    // ── 穿透式获取当前生效的薪资上限 ──
    function getMaxSalaryLimit() {
        const input = document.getElementById("bap-max-salary");
        if (input && input.value) {
            const v = parseInt(input.value, 10);
            if (!isNaN(v) && v > 0) return v;
        }
        const cfg = GM_getValue("boss_auto_config", {});
        if (cfg && cfg.maxSalaryK && cfg.maxSalaryK > 0) return cfg.maxSalaryK;
        return CONFIG.maxSalaryK || 26;
    }

    function getMinSalaryLimit() {
        const input = document.getElementById("bap-min-salary");
        if (input && input.value) {
            const v = parseInt(input.value, 10);
            if (!isNaN(v) && v > 0) return v;
        }
        const cfg = GM_getValue("boss_auto_config", {});
        if (cfg && cfg.minSalaryK && cfg.minSalaryK > 0) return cfg.minSalaryK;
        return CONFIG.minSalaryK || 16;
    }

    // ── 全能薪资解析引擎 ──
    function parseSalaryRange(salaryStr) {
        if (!salaryStr) return { min: 0, max: 0 };
        const cleanStr = salaryStr.replace(/[\u00A0\s]+/g, ' ');

        const rangeRegex = /(\d+)(?:\s*K)?\s*[-–—~－至到]\s*(\d+)\s*K/i;
        const match = cleanStr.match(rangeRegex);
        if (match) {
            const min = parseInt(match[1], 10);
            const max = parseInt(match[2], 10);
            return { min, max };
        }

        const singleRegex = /(\d+)\s*K/i;
        const singleMatch = cleanStr.match(singleRegex);
        if (singleMatch) {
            const val = parseInt(singleMatch[1], 10);
            return { min: val, max: val };
        }

        const wanMatch = cleanStr.match(/(\d+)\s*[-–—~－至到]\s*(\d+)\s*万/i);
        if (wanMatch) {
            let minW = parseInt(wanMatch[1], 10);
            let maxW = parseInt(wanMatch[2], 10);
            if (cleanStr.includes("年") || minW >= 40) {
                return { min: Math.round(minW * 10 / 12), max: Math.round(maxW * 10 / 12) };
            }
            return { min: minW * 10, max: maxW * 10 };
        }

        return { min: 0, max: 0 };
    }

    function extractSalaryFromElement(containerEl) {
        if (!containerEl) return { text: "", range: { min: 0, max: 0 } };

        const fullTxt = (containerEl.innerText || containerEl.textContent || '').replace(/[\u00A0\s]+/g, ' ');

        const match = fullTxt.match(/(\d+(?:\s*K)?\s*[-–—~－至到]\s*\d+\s*K(?:[·\s]*\d+薪)?)/i)
                   || fullTxt.match(/(\d+\s*[-–—~－至到]\s*\d+\s*万)/i)
                   || fullTxt.match(/(\d+\s*K)/i);
        if (match) {
            const parsed = parseSalaryRange(match[0]);
            if (parsed.max > 0) {
                return { text: match[0], range: parsed };
            }
        }

        const candidateSelectors = [
            ".salary", "[class*='salary']", "span.red", ".job-salary", ".salary-wrap", "[class*='price']"
        ];
        for (const sel of candidateSelectors) {
            const els = containerEl.querySelectorAll(sel);
            for (const el of els) {
                const txt = (el.innerText || el.textContent || '').trim();
                if (txt && (txt.includes('K') || txt.includes('k') || txt.includes('薪') || txt.includes('万'))) {
                    const parsed = parseSalaryRange(txt);
                    if (parsed.max > 0) {
                        return { text: txt, range: parsed };
                    }
                }
            }
        }

        return { text: "", range: { min: 0, max: 0 } };
    }

    function getRightDetailSalary(statusBtn) {
        if (statusBtn) {
            let p = statusBtn.parentElement;
            for (let depth = 0; depth < 5 && p && p !== document.body; depth++) {
                const s = extractSalaryFromElement(p);
                if (s.range.max > 0) {
                    return s;
                }
                p = p.parentElement;
            }
        }

        const allTextNodes = Array.from(document.querySelectorAll("span, div, h1, h2, h3, p, b, em"));
        for (const el of allTextNodes) {
            const rect = el.getBoundingClientRect();
            if (rect.left > 320 && rect.top > 50 && rect.top < 380 && rect.width > 0 && rect.height > 0) {
                const txt = (el.innerText || '').trim();
                if (txt.length <= 40 && /(\d+)\s*K?\s*[-–—~－至到]\s*(\d+)\s*K/i.test(txt)) {
                    const parsed = parseSalaryRange(txt);
                    if (parsed.max > 0) {
                        return { text: txt, range: parsed };
                    }
                }
            }
        }

        return { text: "", range: { min: 0, max: 0 } };
    }

    // ── 从右侧详情中抓取真实公司名（第二道防线） ──
    function getRightDetailCompany() {
        const selectors = [
            ".job-detail .company-info a", ".job-detail .company-name", ".company-info-box .name",
            "[class*='company-info'] h3", "[class*='company-info'] [class*='name']"
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && isElementVisible(el)) {
                const txt = (el.innerText || el.textContent || '').trim();
                if (txt) return txt;
            }
        }
        return "";
    }

    function isElementVisible(el) {
        if (!el) return false;
        return el.offsetWidth > 0 && el.offsetHeight > 0;
    }

    function safeClick(element) {
        if (!element) return;
        try {
            element.click();
        } catch (e) {
            try {
                const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
                element.dispatchEvent(evt);
            } catch (err) {}
        }
    }

    // =========================================================================
    // 场景 A：处于聊天页面 (https://www.zhipin.com/web/geek/chat*)
    // =========================================================================
    if (location.href.includes("zhipin.com/web/geek/chat")) {
        console.log("[BossAutoGreet] 检测到当前处于聊天窗口页面，启动终极安检与发送切回引擎...");

        let hasReturned = false;

        function showChatBanner(msg, isSuccess = false, isDanger = false) {
            let banner = document.getElementById("boss-chat-banner");
            if (!banner) {
                banner = document.createElement("div");
                banner.id = "boss-chat-banner";
                banner.style.cssText = `
                    position: fixed;
                    top: 18px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1e293b;
                    color: #fff;
                    padding: 10px 24px;
                    border-radius: 30px;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
                    z-index: 2147483647;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                `;
                document.body.appendChild(banner);
                banner.addEventListener('click', returnToJobList);
            }
            if (isDanger) {
                banner.style.background = '#f56c6c';
            } else if (isSuccess) {
                banner.style.background = '#00bebd';
            } else {
                banner.style.background = '#1e293b';
            }
            banner.innerHTML = `
                <span>${msg}</span>
                <span style="background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: normal;">点击立刻切回 ↩</span>
            `;
        }

        function isInputEmpty(inputEl) {
            if (!inputEl) return true;
            const txt = (inputEl.innerText || inputEl.textContent || inputEl.value || '').trim();
            return txt === '' || txt === '\n' || txt === '\u200B' || txt === '\u00A0';
        }

        function isGreetingSentInChat() {
            const leftSidebar = document.querySelector('.chat-user-list, .user-list, .chat-sidebar, .conversation-list, [class*="user-list"]');
            const candidateBubbles = Array.from(document.querySelectorAll(
                '.item-myself, .message-myself, [class*="item-myself"], [class*="message-myself"], .chat-record, .message-content, .chat-message'
            ));

            for (const bubble of candidateBubbles) {
                if (leftSidebar && leftSidebar.contains(bubble)) continue;
                const txt = bubble.innerText || bubble.textContent || '';
                if (txt.includes("9年前端全栈") || txt.includes("ownagent.com.cn") || txt.includes("SSE Agent")) {
                    return true;
                }
            }

            const allNodes = Array.from(document.querySelectorAll('div, p, span'));
            for (const n of allNodes) {
                if (leftSidebar && leftSidebar.contains(n)) continue;
                const txt = n.innerText || '';
                if (txt.length < 500 && (txt.includes("9年前端全栈") || txt.includes("ownagent.com.cn"))) {
                    return true;
                }
            }

            return false;
        }

        function findSendButton() {
            const selectors = [
                ".btn-send", "button.btn-send", "[class*='btn-send']", ".chat-op button", ".chat-op .btn", ".chat-op span"
            ];
            for (const s of selectors) {
                const el = document.querySelector(s);
                if (el && isElementVisible(el)) return el;
            }
            const allBtns = Array.from(document.querySelectorAll("button, a, div[class*='btn'], span[class*='btn'], span"));
            return allBtns.find(el => {
                const t = (el.innerText || el.textContent || '').trim();
                return (t === "发送" || t.startsWith("发送")) && isElementVisible(el);
            }) || null;
        }

        function triggerSend(chatInput) {
            const sendBtn = findSendButton();
            if (sendBtn) {
                sendBtn.removeAttribute('disabled');
                sendBtn.classList.remove('disabled');
                safeClick(sendBtn);
            }

            ['keydown', 'keypress', 'keyup'].forEach(eventType => {
                try {
                    const ev = new KeyboardEvent(eventType, {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    chatInput.dispatchEvent(ev);
                } catch (e) {}
            });
        }

        function returnToJobList() {
            if (hasReturned) return;
            hasReturned = true;
            showChatBanner("✅ 正在自动返回职位列表继续下一个...", true);

            const lastJobUrl = GM_getValue("boss_last_job_url", "https://www.zhipin.com/web/geek/jobs");

            try {
                if (window.opener || window.history.length <= 2) {
                    window.close();
                }
            } catch (e) {}

            if (window.history.length > 1) {
                window.history.back();
            }

            setTimeout(() => {
                if (location.href.includes("/chat")) {
                    try { window.close(); } catch (e) {}
                    const navJobLink = document.querySelector('header a[href*="/web/geek/jobs"], header a[href*="/web/geek/job"], .nav-item a[href*="/web/geek/job"]');
                    if (navJobLink) {
                        navJobLink.click();
                    } else {
                        location.href = lastJobUrl;
                    }
                }
            }, 1000);

            setTimeout(() => {
                if (location.href.includes("/chat")) {
                    location.replace(lastJobUrl);
                }
            }, 2200);
        }

        async function handleChatPage() {
            const isAutoRunning = GM_getValue("boss_auto_running", false);
            if (!isAutoRunning) {
                console.log("[BossAutoGreet] 自动化当前处于暂停状态。");
                return;
            }

            // ── 聊天页防线 0: 检查公司名是否命中黑名单 ──
            const chatCompanyEl = document.querySelector(".chat-job-info .company-name, .job-header .company, [class*='company-name']");
            const chatCompanyName = chatCompanyEl ? (chatCompanyEl.innerText || '').trim() : '';
            const blockedCompanyHit = isCompanyBlocked(chatCompanyName);
            if (blockedCompanyHit) {
                showChatBanner(`🛑 [公司屏蔽] 当前公司「${chatCompanyName}」命中黑名单「${blockedCompanyHit}」，坚决不投！立即切回...`, false, true);
                let skipped = GM_getValue("boss_skipped_count", 0) + 1;
                GM_setValue("boss_skipped_count", skipped);
                await sleep(1500);
                returnToJobList();
                return;
            }

            const maxLimit = getMaxSalaryLimit();
            const minLimit = getMinSalaryLimit();

            // 抓取聊天页面顶部整个信息头
            let chatHeaderSalary = { text: "", range: { min: 0, max: 0 } };
            for (let check = 0; check < 5; check++) {
                const headerEls = document.querySelectorAll(".chat-job-info, .job-header, [class*='chat-job'], .chat-conversation, header, body");
                for (const h of headerEls) {
                    chatHeaderSalary = extractSalaryFromElement(h);
                    if (chatHeaderSalary.range.max > 0) break;
                }
                if (chatHeaderSalary.range.max > 0) break;
                await sleep(300);
            }

            if (maxLimit > 0 && chatHeaderSalary.range.max > maxLimit) {
                showChatBanner(`🛑 [薪资绝杀] 当前职位薪资 ${chatHeaderSalary.text} (${chatHeaderSalary.range.max}K) 超过上限 ${maxLimit}K，坚决不投！立即切回...`, false, true);
                let skipped = GM_getValue("boss_skipped_count", 0) + 1;
                GM_setValue("boss_skipped_count", skipped);
                await sleep(1500);
                returnToJobList();
                return;
            }

            if (minLimit > 0 && chatHeaderSalary.range.max > 0 && chatHeaderSalary.range.max < minLimit) {
                showChatBanner(`🛑 [薪资绝杀] 当前职位薪资 ${chatHeaderSalary.text} 低于底线 ${minLimit}K，放弃发送，立即切回...`, false, true);
                let skipped = GM_getValue("boss_skipped_count", 0) + 1;
                GM_setValue("boss_skipped_count", skipped);
                await sleep(1500);
                returnToJobList();
                return;
            }

            showChatBanner("⚡ Boss 智能投递: 条件合规，正在定位输入框...");

            let chatInput = null;
            for (let i = 0; i < 16; i++) {
                chatInput = document.querySelector(
                    ".chat-input[contenteditable='true'], div[contenteditable='true'], #chat-input, textarea.chat-input, .chat-editor"
                );
                if (chatInput && isElementVisible(chatInput)) break;
                await sleep(500);
            }

            if (!chatInput) {
                showChatBanner("⚠️ 未检测到聊天输入框，2 秒后自动返回列表...");
                await sleep(2000);
                returnToJobList();
                return;
            }

            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                    setTimeout(() => {
                        if (isGreetingSentInChat() || isInputEmpty(chatInput)) {
                            returnToJobList();
                        }
                    }, 800);
                }
            });

            if (isGreetingSentInChat()) {
                const minSec = CONFIG.minDelaySec || 5;
                const maxSec = CONFIG.maxDelaySec || 15;
                const delaySec = randomRange(minSec, maxSec);
                GM_setValue("boss_cooldown_until", Date.now() + delaySec * 1000);
                GM_setValue("boss_last_delay_sec", delaySec);

                showChatBanner(`✅ 检测到话术已送达！开启 ${delaySec} 秒防封安全冷却，即将切回列表...`, true);
                let todayCount = GM_getValue("boss_greeted_count_" + getTodayStr(), 0) + 1;
                GM_setValue("boss_greeted_count_" + getTodayStr(), todayCount);
                await sleep(1000);
                returnToJobList();
                return;
            }

            showChatBanner("⚡ 正在填入王旭专属打招呼话术...");
            await sleep(600);

            chatInput.focus();

            try {
                document.execCommand('selectAll', false, null);
                document.execCommand('delete', false, null);
                document.execCommand('insertText', false, CONFIG.greetingMessage);
            } catch (e) {
                if (chatInput.isContentEditable) {
                    chatInput.innerText = CONFIG.greetingMessage;
                } else {
                    chatInput.value = CONFIG.greetingMessage;
                }
            }

            chatInput.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: CONFIG.greetingMessage }));
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            chatInput.dispatchEvent(new Event('change', { bubbles: true }));
            chatInput.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));

            await sleep(600);

            showChatBanner("🚀 正在点击【发送】...");
            triggerSend(chatInput);

            for (let check = 0; check < 6; check++) {
                await sleep(600);
                const hasBubble = isGreetingSentInChat();
                const isCleared = isInputEmpty(chatInput);

                if (hasBubble || isCleared) {
                    let todayCount = GM_getValue("boss_greeted_count_" + getTodayStr(), 0) + 1;
                    GM_setValue("boss_greeted_count_" + getTodayStr(), todayCount);

                    const minSec = CONFIG.minDelaySec || 5;
                    const maxSec = CONFIG.maxDelaySec || 15;
                    const delaySec = randomRange(minSec, maxSec);
                    GM_setValue("boss_cooldown_until", Date.now() + delaySec * 1000);
                    GM_setValue("boss_last_delay_sec", delaySec);

                    showChatBanner(`✅ 话术已成功送达！开启 ${delaySec} 秒防封安全冷却，即将返回列表...`, true);
                    await sleep(1000);
                    returnToJobList();
                    return;
                }

                triggerSend(chatInput);
            }

            showChatBanner("👉 话术已就绪！请轻按键盘【Enter】或点右下角【发送】（发完脚本自动切回列表）", false);
            const checkTimer = setInterval(() => {
                if (isGreetingSentInChat() || isInputEmpty(chatInput)) {
                    clearInterval(checkTimer);
                    let todayCount = GM_getValue("boss_greeted_count_" + getTodayStr(), 0) + 1;
                    GM_setValue("boss_greeted_count_" + getTodayStr(), todayCount);

                    const minSec = CONFIG.minDelaySec || 5;
                    const maxSec = CONFIG.maxDelaySec || 15;
                    const delaySec = randomRange(minSec, maxSec);
                    GM_setValue("boss_cooldown_until", Date.now() + delaySec * 1000);
                    GM_setValue("boss_last_delay_sec", delaySec);

                    showChatBanner(`✅ 检测到已发出！开启 ${delaySec} 秒防封安全冷却，即将返回列表...`, true);
                    setTimeout(returnToJobList, 1000);
                }
            }, 300);
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(handleChatPage, 500);
        } else {
            window.addEventListener("load", () => setTimeout(handleChatPage, 500));
        }

        return;
    }

    // =========================================================================
    // 场景 B：处于职位搜索列表页 (https://www.zhipin.com/web/geek/job*)
    // =========================================================================

    let processedSignatures = new Set(GM_getValue("boss_processed_sigs_" + getTodayStr(), []));

    let state = {
        isRunning: GM_getValue("boss_auto_running", false),
        greetedTodayCount: GM_getValue("boss_greeted_count_" + getTodayStr(), 0),
        skippedCount: GM_getValue("boss_skipped_count", 0),
        scrollRetryCount: 0,
        targetTabCity: GM_getValue("boss_target_tab_city", "杭州"),
        tabSwitchRetries: 0,
        timer: null
    };

    function syncConfigFromUI() {
        const maxInput = document.getElementById("bap-max-salary");
        const minInput = document.getElementById("bap-min-salary");
        const maxCountInput = document.getElementById("bap-max-count");
        const excludeCompInput = document.getElementById("bap-exclude-comp");
        const minDelayInput = document.getElementById("bap-min-delay");
        const maxDelayInput = document.getElementById("bap-max-delay");
        if (maxInput) {
            const v = parseInt(maxInput.value, 10);
            if (!isNaN(v) && v > 0) CONFIG.maxSalaryK = v;
        }
        if (minInput) {
            const v = parseInt(minInput.value, 10);
            if (!isNaN(v) && v > 0) CONFIG.minSalaryK = v;
        }
        if (maxCountInput) {
            const v = parseInt(maxCountInput.value, 10);
            if (!isNaN(v) && v > 0) CONFIG.maxGreetCountPerDay = v;
        }
        if (minDelayInput) {
            const v = parseInt(minDelayInput.value, 10);
            if (!isNaN(v) && v > 0) CONFIG.minDelaySec = v;
        }
        if (maxDelayInput) {
            const v = parseInt(maxDelayInput.value, 10);
            if (!isNaN(v) && v > 0) CONFIG.maxDelaySec = Math.max(CONFIG.minDelaySec || 5, v);
        }
        if (excludeCompInput) {
            CONFIG.excludeCompanies = excludeCompInput.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
        }
        GM_setValue("boss_auto_config", CONFIG);
    }

    function saveState() {
        GM_setValue("boss_greeted_count_" + getTodayStr(), state.greetedTodayCount);
        GM_setValue("boss_skipped_count", state.skippedCount);
        GM_setValue("boss_auto_running", state.isRunning);
        GM_setValue("boss_last_job_url", location.href);
        GM_setValue("boss_target_tab_city", state.targetTabCity);
        const arr = Array.from(processedSignatures).slice(-500);
        GM_setValue("boss_processed_sigs_" + getTodayStr(), arr);
    }

    function getElementDepth(el) {
        let depth = 0;
        let cur = el;
        while (cur.parentElement) {
            depth++;
            cur = cur.parentElement;
        }
        return depth;
    }

    function findCityTabElement(cityName) {
        const otherCities = ["杭州", "广州", "苏州"].filter(c => c !== cityName);
        const panel = document.getElementById("boss-auto-panel");
        const miniPill = document.getElementById("boss-mini-pill");
        const banner = document.getElementById("boss-chat-banner");

        const allCandidates = Array.from(document.querySelectorAll("a, span, li, button, div, p"));
        const matches = [];

        for (const el of allCandidates) {
            if (panel && panel.contains(el)) continue;
            if (miniPill && miniPill.contains(el)) continue;
            if (banner && banner.contains(el)) continue;

            if (el.closest('.job-list-box, .job-detail, .job-detail-box, .job-card-wrapper, .job-card-box, [class*="job-detail"]')) {
                continue;
            }

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.top < 10 || rect.top > 180) continue;
            if (rect.left > 850) continue;

            const txt = (el.innerText || el.textContent || '').trim();
            const hasOtherCity = otherCities.some(oc => txt.includes(oc));
            if (txt.includes(cityName) && !hasOtherCity && !txt.includes("推荐") && txt.length <= 25) {
                matches.push({
                    el: el,
                    depth: getElementDepth(el),
                    length: txt.length,
                    text: txt
                });
            }
        }

        if (matches.length === 0) {
            for (const el of allCandidates) {
                if (panel && panel.contains(el)) continue;
                if (el.closest('.job-list-box, .job-detail, .job-detail-box, .job-card-wrapper, [class*="job-detail"]')) continue;

                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) continue;
                if (rect.top > 250) continue;

                const txt = (el.innerText || el.textContent || '').trim();
                const hasOtherCity = otherCities.some(oc => txt.includes(oc));
                if (txt.includes(cityName) && !hasOtherCity && !txt.includes("推荐") && txt.length <= 25) {
                    matches.push({
                        el: el,
                        depth: getElementDepth(el),
                        length: txt.length,
                        text: txt
                    });
                }
            }
        }

        if (matches.length === 0) return null;

        matches.sort((a, b) => {
            if (b.depth !== a.depth) return b.depth - a.depth;
            return a.length - b.length;
        });

        console.log(`[BossAutoGreet] 🎯 精准定位到【${cityName}】Tab:`, matches[0].el, `文本: "${matches[0].text}"`);
        return matches[0].el;
    }

    function findRecommendTabElement() {
        const panel = document.getElementById("boss-auto-panel");
        const all = Array.from(document.querySelectorAll("a, span, li, button, div"));
        const matches = [];

        for (const el of all) {
            if (panel && panel.contains(el)) continue;
            if (el.closest('.job-list-box, .job-detail, .job-detail-box, .job-card-wrapper, [class*="job-detail"]')) continue;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.top < 10 || rect.top > 180) continue;
            if (rect.left > 450) continue;

            const txt = (el.innerText || el.textContent || '').trim();
            if (txt === "推荐") {
                matches.push({ el, depth: getElementDepth(el) });
            }
        }

        if (matches.length === 0) return null;
        matches.sort((a, b) => b.depth - a.depth);
        return matches[0].el;
    }

    function deepClickTab(el) {
        if (!el) return false;

        const targets = new Set();
        targets.add(el);
        if (el.closest('a')) targets.add(el.closest('a'));
        if (el.closest('li')) targets.add(el.closest('li'));
        if (el.closest('[class*="item"]')) targets.add(el.closest('[class*="item"]'));
        if (el.parentElement) targets.add(el.parentElement);
        const childA = el.querySelector('a');
        if (childA) targets.add(childA);

        try {
            el.style.outline = "3px solid #00bebd";
            el.style.boxShadow = "0 0 12px #00bebd";
            setTimeout(() => {
                try {
                    el.style.outline = "";
                    el.style.boxShadow = "";
                } catch (e) {}
            }, 1200);
        } catch (e) {}

        for (const target of targets) {
            try { target.click(); } catch (e) {}

            const evtTypes = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
            for (const type of evtTypes) {
                try {
                    const isPointer = type.startsWith('pointer');
                    const EvtConstructor = isPointer && window.PointerEvent ? PointerEvent : MouseEvent;
                    const event = new EvtConstructor(type, {
                        bubbles: true,
                        cancelable: true,
                        composed: true,
                        view: window,
                        button: 0,
                        buttons: 1,
                        pointerId: 1,
                        isPrimary: true
                    });
                    target.dispatchEvent(event);
                } catch (err) {}
            }
        }
        return true;
    }

    function isCurrentTabRecommend() {
        const filterBar = document.querySelector('.search-conditions, .condition-box, .filter-box, [class*="condition"], [class*="filter"]');
        if (filterBar) {
            const txt = filterBar.innerText || '';
            if (txt.includes("北京") && !txt.includes("杭州") && !txt.includes("广州") && !txt.includes("苏州")) {
                return true;
            }
        }

        const recEl = findRecommendTabElement();
        if (recEl) {
            const targets = [recEl, recEl.parentElement, recEl.closest('a'), recEl.closest('li')].filter(Boolean);
            for (const t of targets) {
                const cls = t.className || '';
                if (cls.includes('active') || cls.includes('cur') || cls.includes('selected') || cls.includes('is-active')) {
                    return true;
                }
                const style = window.getComputedStyle(t);
                if (style.color.includes('190') || style.color.includes('189') || style.color.includes('0, 190')) {
                    return true;
                }
            }
        }

        const targetCity = state.targetTabCity || "杭州";
        const cityTabEl = findCityTabElement(targetCity);
        if (cityTabEl) {
            const targets = [cityTabEl, cityTabEl.parentElement, cityTabEl.closest('a'), cityTabEl.closest('li')].filter(Boolean);
            let hasActiveStyle = false;
            for (const t of targets) {
                const cls = t.className || '';
                if (cls.includes('active') || cls.includes('cur') || cls.includes('selected')) hasActiveStyle = true;
                const style = window.getComputedStyle(t);
                if (style.color.includes('190') || style.color.includes('189') || style.color.includes('0, 190')) hasActiveStyle = true;
            }
            if (!hasActiveStyle) {
                return true;
            }
        }

        return false;
    }

    function getCardSignature(card) {
        if (!card) return "";
        const link = card.querySelector("a[href*='/job_detail/']");
        if (link && link.getAttribute("href")) {
            return link.getAttribute("href").split('?')[0];
        }
        const title = card.querySelector(".job-name, .job-title, [class*='job-name']")?.innerText || '';
        const company = card.querySelector(".company-name, [class*='company-name']")?.innerText || '';
        const salary = card.querySelector(".salary, [class*='salary'], span.red")?.innerText || '';
        return `${title}__${company}__${salary}`.trim();
    }

    function getJobCards() {
        let cards = Array.from(document.querySelectorAll(
            "li.job-card-wrapper, .job-card-wrapper, ul.job-list-box > li, .job-list-box > li, .job-card-box"
        ));
        return cards.filter(card => {
            return card.querySelector(".job-name, .job-title, [class*='job-name'], [class*='job-title']") !== null;
        });
    }

    function findJobScrollContainer() {
        const knownSelectors = [
            '.job-list-box', '.job-list-wrapper', '.job-card-list',
            '.job-side-list', '.job-tab-box', 'ul.job-list-box',
            '.job-list-container'
        ];
        for (const sel of knownSelectors) {
            const el = document.querySelector(sel);
            if (el && el.scrollHeight > el.clientHeight) return el;
        }

        const cards = getJobCards();
        if (cards.length > 0) {
            let parent = cards[0].parentElement;
            while (parent && parent !== document.body && parent !== document.documentElement) {
                const style = window.getComputedStyle(parent);
                const overflowY = style.overflowY;
                if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
                    return parent;
                }
                parent = parent.parentElement;
            }
        }

        return null;
    }

    function triggerInfiniteScrollDown() {
        const container = findJobScrollContainer();
        if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            container.scrollTop = container.scrollHeight;
            container.dispatchEvent(new Event('scroll', { bubbles: true }));
            container.dispatchEvent(new WheelEvent('wheel', { deltaY: 1200, bubbles: true, cancelable: true }));
        }

        const cards = getJobCards();
        if (cards.length > 0) {
            const lastCard = cards[cards.length - 1];
            try { lastCard.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch (e) {}
        }

        window.scrollBy({ top: 1000, left: 0, behavior: 'smooth' });
        window.dispatchEvent(new Event('scroll'));
    }

    function getJobCommunicationStatus() {
        const candidates = Array.from(document.querySelectorAll(
            '.btn-startchat, a[ka*="chat"], .job-op a, .job-banner a, .op-btn, .btn-sure, a.btn, button.btn, .btn'
        ));

        for (const el of candidates) {
            if (!isElementVisible(el)) continue;
            const rect = el.getBoundingClientRect();
            if (rect.left < 300) continue;

            const txt = (el.innerText || el.textContent || '').trim();
            if (txt === "继续沟通" || txt === "已沟通") {
                return { type: "ALREADY_CHATTED", button: el, text: txt };
            }
            if (txt === "立即沟通" || txt === "聊一聊") {
                return { type: "START_CHAT", button: el, text: txt };
            }
        }
        return null;
    }

    // ── 注入悬浮控制面板 UI ──
    function injectUI() {
        try {
            if (document.getElementById("boss-auto-panel")) return;
            if (!document.body) return;

            if (!document.getElementById("boss-mini-pill")) {
                const pill = document.createElement("div");
                pill.id = "boss-mini-pill";
                pill.innerHTML = "⚡ 投递助手";
                pill.style.cssText = `
                    position: fixed;
                    top: 130px;
                    right: 0;
                    background: #00bebd;
                    color: #fff;
                    padding: 6px 12px;
                    border-radius: 20px 0 0 20px;
                    font-size: 12px;
                    font-weight: 600;
                    box-shadow: -2px 4px 12px rgba(0,0,0,0.2);
                    z-index: 2147483646;
                    cursor: pointer;
                    display: none;
                `;
                document.body.appendChild(pill);
                pill.addEventListener('click', () => {
                    const p = document.getElementById("boss-auto-panel");
                    if (p) p.style.display = "block";
                    pill.style.display = "none";
                });
            }

            const currentMaxSalary = getMaxSalaryLimit();
            const currentMinSalary = getMinSalaryLimit();

            const panel = document.createElement("div");
            panel.id = "boss-auto-panel";
            panel.innerHTML = `
                <div class="bap-header">
                    <span class="bap-title">⚡ Boss 智能投递 (王旭·全栈/AI版 v3.8.2)</span>
                    <button id="bap-toggle-btn" class="bap-btn-mini" title="最小化">_</button>
                </div>
                <div class="bap-body" id="bap-body-content">
                    <div class="bap-status-card">
                        <div class="bap-stat-item">
                            <span class="bap-stat-label">今日已打招呼</span>
                            <span class="bap-stat-value" id="bap-greeted-num">${state.greetedTodayCount} / ${CONFIG.maxGreetCountPerDay}</span>
                        </div>
                        <div class="bap-stat-item">
                            <span class="bap-stat-label">已过滤跳过</span>
                            <span class="bap-stat-value" id="bap-skipped-num">${state.skippedCount}</span>
                        </div>
                    </div>

                    <div class="bap-field">
                        <label>打招呼人设话术（自动推送）:</label>
                        <textarea id="bap-greeting-msg" rows="3">${CONFIG.greetingMessage}</textarea>
                    </div>

                    <div class="bap-card-section">
                        <div class="bap-row">
                            <div class="bap-col">
                                <label>💰 底薪下限 (低于跳过):</label>
                                <div class="bap-input-wrap">
                                    <input type="number" id="bap-min-salary" value="${currentMinSalary}" placeholder="16" title="最高薪资低于此值则跳过" />
                                    <span class="bap-unit">K</span>
                                </div>
                            </div>
                            <div class="bap-col">
                                <label>🛑 薪资上限 (高于绝杀):</label>
                                <div class="bap-input-wrap">
                                    <input type="number" id="bap-max-salary" value="${currentMaxSalary}" placeholder="26" title="图2详情页【立即沟通】点击前物理绝杀！" />
                                    <span class="bap-unit">K</span>
                                </div>
                            </div>
                        </div>
                        <div class="bap-row" style="margin-top: 8px;">
                            <div class="bap-col">
                                <label>🎯 单日上限 (保护账号):</label>
                                <div class="bap-input-wrap">
                                    <input type="number" id="bap-max-count" value="${CONFIG.maxGreetCountPerDay}" title="单日最大打招呼总数" />
                                    <span class="bap-unit">个</span>
                                </div>
                            </div>
                            <div class="bap-col">
                                <label>⏳ 投后防封冷却 (随机):</label>
                                <div class="bap-input-wrap bap-range-wrap">
                                    <input type="number" id="bap-min-delay" value="${CONFIG.minDelaySec || 5}" title="投完一个后最小随机等待秒数" />
                                    <span class="bap-sep">~</span>
                                    <input type="number" id="bap-max-delay" value="${CONFIG.maxDelaySec || 15}" title="投完一个后最大随机等待秒数" />
                                    <span class="bap-unit">秒</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bap-field">
                        <label>📌 期望城市Tab锁定 (防重置回推荐):</label>
                        <div style="display: flex; gap: 5px;">
                            <button id="bap-tab-hz" class="bap-btn ${state.targetTabCity === '杭州' ? 'bap-btn-primary' : 'bap-btn-secondary'}" style="flex:1; padding: 6px 4px;">锁定杭州</button>
                            <button id="bap-tab-gz" class="bap-btn ${state.targetTabCity === '广州' ? 'bap-btn-primary' : 'bap-btn-secondary'}" style="flex:1; padding: 6px 4px;">锁定广州</button>
                            <button id="bap-tab-sz" class="bap-btn ${state.targetTabCity === '苏州' ? 'bap-btn-primary' : 'bap-btn-secondary'}" style="flex:1; padding: 6px 4px;">锁定苏州</button>
                        </div>
                    </div>

                    <div class="bap-field">
                        <label>📍 目标城市 (非目标城市直接跳过):</label>
                        <input type="text" id="bap-target-cities" value="${CONFIG.targetCities.join(',')}" placeholder="杭州,广州,苏州" />
                    </div>

                    <div class="bap-field">
                        <label>🎯 目标岗位词 (必须命中):</label>
                        <input type="text" id="bap-target-kw" value="${CONFIG.targetJobKeywords.join(',')}" placeholder="前端,全栈,AI,React,Node..." />
                    </div>

                    <div class="bap-field">
                        <label>🚫 排除关键词 (命中跳过):</label>
                        <input type="text" id="bap-exclude-kw" value="${CONFIG.excludeKeywords.join(',')}" />
                    </div>

                    <div class="bap-field">
                        <label style="color: #e6a23c; font-weight: bold;">🏢 屏蔽公司黑名单 (命中坚决不投):</label>
                        <input type="text" id="bap-exclude-comp" value="${(CONFIG.excludeCompanies || []).join(',')}" placeholder="天阳,软通,汇合,中软,外包..." title="逗号分隔，命中任意字眼直接绝杀" />
                    </div>

                    <div class="bap-status-msg" id="bap-status-text">${state.isRunning ? '正在自动恢复投递进度...' : '就绪待命（三城接力 + 薪资上限 + 屏蔽公司三重绝杀拦截）'}</div>

                    <div class="bap-actions">
                        <button id="bap-start-btn" class="bap-btn ${state.isRunning ? 'bap-btn-stop' : 'bap-btn-primary'}">${state.isRunning ? '暂停投递' : '开始自动投递'}</button>
                        <button id="bap-scroll-btn" class="bap-btn bap-btn-secondary" title="手动向下滚屏加载新职位">📜 下拉</button>
                        <button id="bap-reset-btn" class="bap-btn bap-btn-secondary">重置</button>
                    </div>
                </div>
            `;

            const style = document.createElement("style");
            style.textContent = `
                #boss-auto-panel {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 350px;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(12px);
                    border: 2px solid #00bebd;
                    border-radius: 12px;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
                    z-index: 2147483647 !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 13px;
                    color: #24292e;
                    overflow: hidden;
                }
                .bap-header {
                    background: linear-gradient(135deg, #00bebd, #008f8e);
                    color: #fff;
                    padding: 10px 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                }
                .bap-title { font-size: 13px; letter-spacing: 0.5px; }
                .bap-btn-mini { background: transparent; border: none; color: #fff; font-size: 16px; cursor: pointer; }
                .bap-body { padding: 12px 14px; max-height: 85vh; overflow-y: auto; }
                .bap-status-card {
                    display: flex;
                    justify-content: space-between;
                    background: #f0faf9;
                    border: 1px solid #d2f1f0;
                    border-radius: 8px;
                    padding: 8px 14px;
                    margin-bottom: 8px;
                }
                .bap-stat-item { display: flex; flex-direction: column; align-items: center; }
                .bap-stat-label { font-size: 11px; color: #666; margin-bottom: 2px; }
                .bap-stat-value { font-size: 15px; font-weight: 700; color: #00bebd; }
                .bap-field { margin-bottom: 8px; }
                .bap-field label { display: block; font-size: 11px; color: #555; margin-bottom: 4px; font-weight: 500; }
                .bap-field textarea, .bap-field input {
                    width: 100%;
                    box-sizing: border-box;
                    border: 1px solid #dcdfe6;
                    border-radius: 6px;
                    padding: 6px 8px;
                    font-size: 12px;
                    outline: none;
                    transition: border 0.2s;
                }
                .bap-field textarea:focus, .bap-field input:focus { border-color: #00bebd; }

                /* ── 2x2 优雅卡片布局 ── */
                .bap-card-section {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 8px 10px;
                    margin-bottom: 8px;
                }
                .bap-row { display: flex; gap: 8px; }
                .bap-col { flex: 1; min-width: 0; }
                .bap-col label { display: block; font-size: 11px; color: #475569; margin-bottom: 3px; font-weight: 600; white-space: nowrap; }
                .bap-input-wrap {
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 0 8px;
                    height: 30px;
                    box-sizing: border-box;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .bap-input-wrap:focus-within {
                    border-color: #00bebd;
                    box-shadow: 0 0 0 2px rgba(0, 190, 189, 0.15);
                }
                .bap-input-wrap input {
                    width: 100% !important;
                    border: none !important;
                    outline: none !important;
                    padding: 0 !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: #1e293b !important;
                    background: transparent !important;
                    -moz-appearance: textfield;
                }
                .bap-input-wrap input::-webkit-inner-spin-button,
                .bap-input-wrap input::-webkit-outer-spin-button {
                    -webkit-appearance: none !important;
                    margin: 0 !important;
                }
                .bap-unit {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 500;
                    margin-left: 4px;
                    user-select: none;
                    flex-shrink: 0;
                }
                .bap-range-wrap {
                    padding: 0 4px;
                    gap: 2px;
                }
                .bap-range-wrap input {
                    width: 32px !important;
                    text-align: center !important;
                    color: #00bebd !important;
                    font-weight: 700 !important;
                }
                .bap-sep {
                    font-size: 12px;
                    color: #94a3b8;
                    font-weight: bold;
                    user-select: none;
                    flex-shrink: 0;
                }
                .bap-status-msg {
                    font-size: 12px;
                    color: #e6a23c;
                    background: #fdf6ec;
                    padding: 8px 10px;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    min-height: 20px;
                    line-height: 1.4;
                    word-break: break-all;
                }
                .bap-actions { display: flex; gap: 8px; }
                .bap-btn {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.1s;
                    font-size: 12px;
                }
                .bap-btn:active { transform: scale(0.98); }
                .bap-btn-primary { flex: 2; background: #00bebd; color: #fff; }
                .bap-btn-primary:hover { background: #00a4a3; }
                .bap-btn-stop { flex: 2; background: #f56c6c !important; color: #fff; }
                .bap-btn-secondary { flex: 1; background: #f4f4f5; color: #606266; border: 1px solid #dcdfe6; }
                .bap-btn-secondary:hover { background: #e9e9eb; }
            `;

            document.head.appendChild(style);
            document.body.appendChild(panel);

            const startBtn = document.getElementById("bap-start-btn");
            const resetBtn = document.getElementById("bap-reset-btn");
            const scrollBtn = document.getElementById("bap-scroll-btn");
            const toggleBtn = document.getElementById("bap-toggle-btn");
            const tabHzBtn = document.getElementById("bap-tab-hz");
            const tabGzBtn = document.getElementById("bap-tab-gz");
            const tabSzBtn = document.getElementById("bap-tab-sz");

            toggleBtn?.addEventListener("click", () => {
                panel.style.display = "none";
                const pill = document.getElementById("boss-mini-pill");
                if (pill) pill.style.display = "block";
            });

            tabHzBtn?.addEventListener("click", () => {
                state.targetTabCity = "杭州";
                state.tabSwitchRetries = 0;
                saveState();
                updateTabButtonsUI();
                const el = findCityTabElement("杭州");
                if (el) {
                    deepClickTab(el);
                    logStatus("📌 已切换并强力锁定「杭州」期望职位Tab！");
                }
            });

            tabGzBtn?.addEventListener("click", () => {
                state.targetTabCity = "广州";
                state.tabSwitchRetries = 0;
                saveState();
                updateTabButtonsUI();
                const el = findCityTabElement("广州");
                if (el) {
                    deepClickTab(el);
                    logStatus("📌 已切换并强力锁定「广州」期望职位Tab！");
                }
            });

            tabSzBtn?.addEventListener("click", () => {
                state.targetTabCity = "苏州";
                state.tabSwitchRetries = 0;
                saveState();
                updateTabButtonsUI();
                const el = findCityTabElement("苏州");
                if (el) {
                    deepClickTab(el);
                    logStatus("📌 已切换并强力锁定「苏州」期望职位Tab！");
                }
            });

            scrollBtn?.addEventListener("click", () => {
                logStatus("📜 正在手动向下滚动拉取新职位...");
                triggerInfiniteScrollDown();
            });

            resetBtn?.addEventListener("click", () => {
                state.greetedTodayCount = 0;
                state.skippedCount = 0;
                state.scrollRetryCount = 0;
                processedSignatures.clear();
                saveState();
                updateUI();
                logStatus("今日计数与已处理职位记录已重置！");
            });

            startBtn?.addEventListener("click", () => {
                syncConfigFromUI();
                if (state.isRunning) {
                    stopAutoGreet("用户手动暂停");
                } else {
                    startAutoGreet();
                }
            });

            document.getElementById("bap-greeting-msg")?.addEventListener("change", (e) => {
                CONFIG.greetingMessage = e.target.value;
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-min-salary")?.addEventListener("input", (e) => {
                CONFIG.minSalaryK = parseInt(e.target.value, 10) || 16;
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-max-salary")?.addEventListener("input", (e) => {
                CONFIG.maxSalaryK = parseInt(e.target.value, 10) || 26;
                GM_setValue("boss_auto_config", CONFIG);
                logStatus(`💰 薪资上限已实时设为: ${CONFIG.maxSalaryK}K (超此值图2直接绝杀不投)`);
            });
            document.getElementById("bap-max-count")?.addEventListener("change", (e) => {
                CONFIG.maxGreetCountPerDay = parseInt(e.target.value, 10) || 50;
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-min-delay")?.addEventListener("input", (e) => {
                CONFIG.minDelaySec = Math.max(1, parseInt(e.target.value, 10) || 5);
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-max-delay")?.addEventListener("input", (e) => {
                CONFIG.maxDelaySec = Math.max(CONFIG.minDelaySec || 5, parseInt(e.target.value, 10) || 15);
                GM_setValue("boss_auto_config", CONFIG);
                logStatus(`⏱️ 投递后随机等待冷却已设为: ${CONFIG.minDelaySec || 5} - ${CONFIG.maxDelaySec} 秒`);
            });
            document.getElementById("bap-target-cities")?.addEventListener("change", (e) => {
                CONFIG.targetCities = e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-target-kw")?.addEventListener("change", (e) => {
                CONFIG.targetJobKeywords = e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-exclude-kw")?.addEventListener("change", (e) => {
                CONFIG.excludeKeywords = e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                GM_setValue("boss_auto_config", CONFIG);
            });
            document.getElementById("bap-exclude-comp")?.addEventListener("change", (e) => {
                CONFIG.excludeCompanies = e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                GM_setValue("boss_auto_config", CONFIG);
                logStatus(`🏢 屏蔽公司黑名单已更新: 包含 ${CONFIG.excludeCompanies.length} 家公司`);
            });
        } catch (e) {
            console.error("[BossAutoGreet injectUI error]", e);
        }
    }

    function updateTabButtonsUI() {
        const tabHzBtn = document.getElementById("bap-tab-hz");
        const tabGzBtn = document.getElementById("bap-tab-gz");
        const tabSzBtn = document.getElementById("bap-tab-sz");
        if (tabHzBtn) {
            tabHzBtn.className = state.targetTabCity === '杭州' ? 'bap-btn bap-btn-primary' : 'bap-btn bap-btn-secondary';
        }
        if (tabGzBtn) {
            tabGzBtn.className = state.targetTabCity === '广州' ? 'bap-btn bap-btn-primary' : 'bap-btn bap-btn-secondary';
        }
        if (tabSzBtn) {
            tabSzBtn.className = state.targetTabCity === '苏州' ? 'bap-btn bap-btn-primary' : 'bap-btn bap-btn-secondary';
        }
    }

    function updateUI() {
        const greetedEl = document.getElementById("bap-greeted-num");
        const skippedEl = document.getElementById("bap-skipped-num");
        const startBtn = document.getElementById("bap-start-btn");

        state.skippedCount = GM_getValue("boss_skipped_count", state.skippedCount);

        if (greetedEl) greetedEl.textContent = `${state.greetedTodayCount} / ${CONFIG.maxGreetCountPerDay}`;
        if (skippedEl) skippedEl.textContent = state.skippedCount;

        if (startBtn) {
            if (state.isRunning) {
                startBtn.textContent = "暂停投递";
                startBtn.className = "bap-btn bap-btn-stop";
            } else {
                startBtn.textContent = "开始自动投递";
                startBtn.className = "bap-btn bap-btn-primary";
            }
        }
        updateTabButtonsUI();
    }

    function logStatus(msg) {
        const statusEl = document.getElementById("bap-status-text");
        if (statusEl) {
            statusEl.textContent = msg;
        }
        console.log(`[BossAutoGreet] ${msg}`);
    }

    function checkCaptcha() {
        const captchaEl = document.querySelector(".geetest_panel, .geetest_popup, [class*='dialog-captcha'], [class*='verify-slider']");
        return !!(captchaEl && captchaEl.offsetParent !== null);
    }

    function startAutoGreet() {
        syncConfigFromUI();
        if (state.greetedTodayCount >= CONFIG.maxGreetCountPerDay) {
            alert(`今日打招呼已达设定上限（${CONFIG.maxGreetCountPerDay}个），为保护账号安全，请明天再试！`);
            return;
        }
        state.isRunning = true;
        state.scrollRetryCount = 0;
        saveState();
        updateUI();
        logStatus("自动化已启动，正在扫描本页职位...");
        runLoop();
    }

    function stopAutoGreet(reason) {
        state.isRunning = false;
        saveState();
        if (state.timer) clearTimeout(state.timer);
        updateUI();
        logStatus(reason || "已暂停");
    }

    async function runLoop() {
        if (!state.isRunning) return;

        try {
            syncConfigFromUI();
            const currentMaxLimit = getMaxSalaryLimit();
            const currentMinLimit = getMinSalaryLimit();

            // ── 🛡️ 检查是否有跨页面 / 刷新未结束的投后防封持久冷却 ──
            const cooldownUntil = GM_getValue("boss_cooldown_until", 0);
            const lastDelaySec = GM_getValue("boss_last_delay_sec", 10);
            if (cooldownUntil > Date.now()) {
                while (Date.now() < cooldownUntil) {
                    if (!state.isRunning) return;
                    const remain = Math.ceil((cooldownUntil - Date.now()) / 1000);
                    logStatus(`⏳ [随机防封冷却中] 刚投完上一职位，等待安全倒计时: ${remain} 秒 (共${lastDelaySec}s随机防封)...`);
                    await sleep(1000);
                }
                logStatus(`✨ 冷却完成！正在检索下一个合适职位...`);
                await sleep(400);
            }

            if (state.greetedTodayCount >= CONFIG.maxGreetCountPerDay) {
                stopAutoGreet(`已达单日打招呼上限（${CONFIG.maxGreetCountPerDay}个），自动停止保护账号。`);
                return;
            }

            if (checkCaptcha()) {
                stopAutoGreet("⚠️ 触发安全滑块验证码！已为您暂停脚本，请手动滑完后点击【开始自动投递】继续！");
                return;
            }

            const targetCity = state.targetTabCity || "杭州";
            if (isCurrentTabRecommend()) {
                state.tabSwitchRetries = (state.tabSwitchRetries || 0) + 1;
                logStatus(`📌 检测到页面在【推荐】，正在强力穿透切回【${targetCity}】Tab (尝试 ${state.tabSwitchRetries})...`);

                const tabEl = findCityTabElement(targetCity);
                if (tabEl) {
                    deepClickTab(tabEl);
                    await sleep(2500);

                    if (!isCurrentTabRecommend()) {
                        state.tabSwitchRetries = 0;
                        logStatus(`✅ 已成功切回【${targetCity}】专属期望Tab！准备扫描职位...`);
                        await sleep(800);
                        return runLoop();
                    }
                }

                if (state.tabSwitchRetries >= 3) {
                    logStatus(`👉 提示：已为您高亮顶部【${targetCity}】Tab，请轻按一下该Tab，脚本将自动锁定继续！`);
                    if (tabEl) {
                        try {
                            tabEl.style.outline = "4px solid #ff4d4f";
                            tabEl.style.boxShadow = "0 0 16px #ff4d4f";
                        } catch (e) {}
                    }
                    await sleep(3000);
                    return runLoop();
                }

                await sleep(1500);
                return runLoop();
            } else {
                state.tabSwitchRetries = 0;
            }

            const jobCards = getJobCards();

            if (!jobCards || jobCards.length === 0) {
                logStatus("未找到职位卡片，等待加载或请先在页面搜索相关职位...");
                state.timer = setTimeout(runLoop, 2500);
                return;
            }

            let targetCard = null;
            let targetSig = "";
            let remainingNewCards = 0;

            for (let i = 0; i < jobCards.length; i++) {
                const c = jobCards[i];
                const sig = getCardSignature(c);
                if (!processedSignatures.has(sig)) {
                    if (!targetCard) {
                        targetCard = c;
                        targetSig = sig;
                    }
                    remainingNewCards++;
                }
            }

            if (remainingNewCards > 0 && remainingNewCards <= 3 && CONFIG.autoNextPage) {
                triggerInfiniteScrollDown();
            }

            if (!targetCard) {
                if (CONFIG.autoNextPage && state.scrollRetryCount < 4) {
                    state.scrollRetryCount++;
                    logStatus(`📜 当前 ${jobCards.length} 个职位已全部检查过，正在向下滚动拉取下一批... (重试 ${state.scrollRetryCount}/4)`);
                    triggerInfiniteScrollDown();
                    await sleep(2500);
                    return runLoop();
                } else if (state.scrollRetryCount >= 4) {
                    // 三城无缝自动接力轮换：杭州 -> 广州 -> 苏州
                    if (state.targetTabCity === "杭州") {
                        logStatus("🎉「杭州」职位已全部投递完毕！正在自动切换至「广州」继续投递...");
                        state.targetTabCity = "广州";
                        saveState();
                        updateUI();
                        const gzTabEl = findCityTabElement("广州");
                        if (gzTabEl) {
                            deepClickTab(gzTabEl);
                            state.scrollRetryCount = 0;
                            await sleep(2500);
                            return runLoop();
                        }
                    } else if (state.targetTabCity === "广州") {
                        logStatus("🎉「广州」职位已全部投递完毕！正在自动切换至「苏州」继续投递...");
                        state.targetTabCity = "苏州";
                        saveState();
                        updateUI();
                        const szTabEl = findCityTabElement("苏州");
                        if (szTabEl) {
                            deepClickTab(szTabEl);
                            state.scrollRetryCount = 0;
                            await sleep(2500);
                            return runLoop();
                        }
                    } else {
                        stopAutoGreet("「杭州」、「广州」与「苏州」三地期望职位均已全部投递完成！");
                        return;
                    }
                }
            }

            state.scrollRetryCount = 0;
            const card = targetCard;
            processedSignatures.add(targetSig);
            saveState();

            try {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) {}

            const titleEl = card.querySelector(".job-name, .job-title, [class*='job-name'], [class*='job-title']");
            const companyEl = card.querySelector(".company-name, [class*='company-name']");
            const areaEl = card.querySelector(".job-area, .company-location, .job-card-right, [class*='area'], [class*='location']");

            const title = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : "";
            const company = companyEl ? (companyEl.innerText || companyEl.textContent || '').trim() : "";
            const areaText = areaEl ? (areaEl.innerText || areaEl.textContent || '').trim() : "";
            const cardFullText = card.innerText || "";
            const lowerTitle = title.toLowerCase();

            // ── 薪资提取 ──
            const salaryInfo = extractSalaryFromElement(card);
            const salaryRange = salaryInfo.range;
            const salaryText = salaryInfo.text || "面议";

            logStatus(`[已检 ${processedSignatures.size}] 分析: ${title || '职位'} | ${company || '公司'} | ${salaryText} [识:${salaryRange.min}-${salaryRange.max}K 上限:${currentMaxLimit}K]`);

            // 过滤准则 0: 城市白名单
            if (CONFIG.targetCities && CONFIG.targetCities.length > 0) {
                const isCityMatch = CONFIG.targetCities.some(city =>
                    areaText.includes(city) || cardFullText.includes(city)
                );
                if (!isCityMatch) {
                    state.skippedCount++;
                    saveState();
                    updateUI();
                    logStatus(`[跳过] 非目标城市 (仅限${CONFIG.targetCities.join('/')}): ${title} @ ${company}`);
                    await sleep(350);
                    return runLoop();
                }
            }

            // 过滤准则 1: 目标岗位匹配
            if (CONFIG.targetJobKeywords && CONFIG.targetJobKeywords.length > 0) {
                const isTargetJob = CONFIG.targetJobKeywords.some(kw => lowerTitle.includes(kw.toLowerCase()));
                if (!isTargetJob) {
                    state.skippedCount++;
                    saveState();
                    updateUI();
                    logStatus(`[跳过] 非目标技术岗: ${title}`);
                    await sleep(350);
                    return runLoop();
                }
            }

            // 过滤准则 2: 排除黑名单词
            for (const kw of CONFIG.excludeKeywords) {
                if (lowerTitle.includes(kw.toLowerCase())) {
                    state.skippedCount++;
                    saveState();
                    updateUI();
                    logStatus(`[跳过] 命中黑名单关键词「${kw}」: ${title}`);
                    await sleep(350);
                    return runLoop();
                }
            }

            // 过滤准则 3: 排除黑名单公司（第一道防线：卡片初筛）
            const hitBlockedCompany = isCompanyBlocked(company);
            if (hitBlockedCompany) {
                state.skippedCount++;
                saveState();
                updateUI();
                logStatus(`[跳过] 命中黑名单公司「${hitBlockedCompany}」: ${company}`);
                await sleep(350);
                return runLoop();
            }

            // 过滤准则 4: 薪资底线
            if (currentMinLimit > 0 && salaryRange.max > 0 && salaryRange.max < currentMinLimit) {
                state.skippedCount++;
                saveState();
                updateUI();
                logStatus(`[跳过] 最高薪资 ${salaryRange.max}K 低于底线 ${currentMinLimit}K: ${salaryText}`);
                await sleep(350);
                return runLoop();
            }

            // 过滤准则 5: 严格薪资上限（卡片初筛）
            if (currentMaxLimit > 0 && salaryRange.max > 0 && salaryRange.max > currentMaxLimit) {
                state.skippedCount++;
                saveState();
                updateUI();
                logStatus(`[卡片跳过] 薪资 ${salaryRange.max}K 超过上限 ${currentMaxLimit}K (坚决拦截): ${salaryText}`);
                await sleep(350);
                return runLoop();
            }

            // ── 点击左侧卡片，唤起右侧详情 ──
            const clickTarget = card.querySelector(".job-card-left, .job-info, .job-title") || card;
            safeClick(clickTarget);

            // 等待右侧详情加载
            await sleep(900);

            // ── 过滤准则 6: 检查右侧详情中的真实公司名（第二道防线） ──
            const rightDetailCompany = getRightDetailCompany();
            const detailBlockedCompanyHit = isCompanyBlocked(rightDetailCompany);
            if (detailBlockedCompanyHit) {
                state.skippedCount++;
                saveState();
                updateUI();
                logStatus(`🛑 [详情页拦截] 命中黑名单公司「${detailBlockedCompanyHit}」(${rightDetailCompany})，绝不沟通！`);
                await sleep(300);
                return runLoop();
            }

            // ── 获取右侧【立即沟通】按钮 ──
            let status = getJobCommunicationStatus();
            if (!status) {
                await sleep(600);
                status = getJobCommunicationStatus();
            }

            if (!status) {
                state.skippedCount++;
                saveState();
                updateUI();
                logStatus(`[跳过] 未检测到沟通按钮: ${title}`);
                await sleep(300);
                return runLoop();
            }

            if (status.type === "ALREADY_CHATTED") {
                state.skippedCount++;
                saveState();
                updateUI();
                logStatus(`[跳过] 之前已经沟通（${status.text}）: ${title}`);
                await sleep(300);
                return runLoop();
            }

            // ── 🛡️ 【图2详情页核心绝杀门闩】在点击【立即沟通】前的最后一微秒执行！ ──
            const detailSalary = getRightDetailSalary(status.button);
            console.log(`[BossAutoGreet 图2右侧详情薪资识别]`, detailSalary);

            if (detailSalary.range.max > 0) {
                if (currentMaxLimit > 0 && detailSalary.range.max > currentMaxLimit) {
                    state.skippedCount++;
                    saveState();
                    updateUI();
                    logStatus(`🛑 [图2详情页绝杀] 职位「${title}」薪资 ${detailSalary.text} (${detailSalary.range.max}K) 超过上限 ${currentMaxLimit}K，坚决不点立即沟通！`);
                    try {
                        status.button.style.border = "3px solid red";
                        status.button.title = "已拦截：薪资超过上限！";
                    } catch (e) {}
                    await sleep(400);
                    return runLoop();
                }

                if (currentMinLimit > 0 && detailSalary.range.max < currentMinLimit) {
                    state.skippedCount++;
                    saveState();
                    updateUI();
                    logStatus(`🛑 [图2详情页绝杀] 职位「${title}」薪资 ${detailSalary.text} 低于底线 ${currentMinLimit}K，放弃投递！`);
                    await sleep(400);
                    return runLoop();
                }
            }

            if (status.type === "START_CHAT") {
                logStatus(`🎯 薪资与公司合规 (${detailSalary.text || salaryText})，准备打招呼: ${title} @ ${company}`);

                const prepDelay = randomRange(1500, 2500);
                await sleep(prepDelay);

                if (!state.isRunning) return;

                saveState();

                logStatus(`🚀 发起沟通: ${title} @ ${company}...`);
                safeClick(status.button);

                await sleep(1500);
                const dialogTextarea = document.querySelector(
                    ".chat-input, .dialog-chat-input textarea, textarea.boss-chat-editor-input, [class*='chat-input'] textarea, .dialog-container textarea"
                );
                const sendBtn = document.querySelector(
                    ".btn-send, .dialog-footer .btn-sure, [class*='btn-send'], [class*='chat-send-btn']"
                );
                if (dialogTextarea && sendBtn && isElementVisible(dialogTextarea)) {
                    dialogTextarea.value = CONFIG.greetingMessage;
                    dialogTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    await sleep(800);
                    safeClick(sendBtn);
                    logStatus(`📝 弹窗内已自动发送王旭定制打招呼文案！`);
                    state.greetedTodayCount++;
                    saveState();
                    updateUI();
                } else {
                    // 若无弹窗直接发起成功，亦计入打招呼统计
                    state.greetedTodayCount++;
                    saveState();
                    updateUI();
                }

                // ── 🛡️ 投完一个，计算并执行随机等待 5 - 15 秒（实时秒级倒计时） ──
                syncConfigFromUI();
                const minWait = Math.max(1, CONFIG.minDelaySec || 5);
                const maxWait = Math.max(minWait, CONFIG.maxDelaySec || 15);
                const delaySec = randomRange(minWait, maxWait);

                GM_setValue("boss_cooldown_until", Date.now() + delaySec * 1000);
                GM_setValue("boss_last_delay_sec", delaySec);

                // 让用户在界面上肉眼看到秒数逐秒递减
                for (let remain = delaySec; remain > 0; remain--) {
                    if (!state.isRunning) return;
                    logStatus(`⏳ [随机安全防封] 本职位已成功发起沟通，防封倒计时: ${remain} 秒 (${delaySec}s随机冷却，区间${minWait}-${maxWait}s)...`);
                    await sleep(1000);
                }
                logStatus(`✨ 安全冷却完成！准备寻找下一个目标职位...`);
                await sleep(500);
                return runLoop();
            }
        } catch (err) {
            console.error("[BossAutoGreet Error]", err);
            logStatus(`[异常自愈] 出错: ${err.message || '未知异常'}，3秒后继续...`);
            state.skippedCount++;
            saveState();
            updateUI();
            state.timer = setTimeout(runLoop, 3000);
        }
    }

    function initListPage() {
        injectUI();
        if (state.isRunning) {
            setTimeout(runLoop, 1500);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initListPage, 300);
    } else {
        window.addEventListener("DOMContentLoaded", () => setTimeout(initListPage, 300));
        window.addEventListener("load", () => setTimeout(initListPage, 500));
    }

    window.addEventListener("pageshow", () => {
        setTimeout(initListPage, 500);
    });
    window.addEventListener("popstate", () => {
        setTimeout(initListPage, 500);
    });

    setInterval(() => {
        if (!document.getElementById("boss-auto-panel") && location.href.includes("zhipin.com/web/geek/")) {
            injectUI();
        }
    }, 1500);

})();

