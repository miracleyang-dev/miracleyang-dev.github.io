/* =====================================================================
   SITE_DATA - Edit content here
   ===================================================================== */

var SITE_DATA = {
  site: { title: 'Chronicle', subtitle: { en: '', zh: '' }, lastUpdate: '' },
  character: { links: [] },
  stats: [],
  files: [],
  progress: [],
  targets: [],
  repos: [],
  essays: [],
  records: [],
  achievements: []
};

function loadSiteData() {
  var files = [
    'database/profile.json',
    'database/vocation.json',
    'database/being.json',
  ];

  return Promise.all(files.map(function(path) {
    return fetch(path).then(function(resp) {
      if (!resp.ok) throw new Error('Failed to load ' + path);
      return resp.json();
    });
  })).then(function(parts) {
    SITE_DATA = Object.assign({}, SITE_DATA, parts[0], parts[1], parts[2]);
  });
}

const UI_TEXT = {
  tabProfile: { en: "Profile", zh: "个人" },
  tabVocation: { en: "Vocation", zh: "事业" },
  tabBeing: { en: "Being", zh: "生活" },
  subCharacter: { en: "Character", zh: "角色" },
  subDocuments: { en: "Documents", zh: "文档" },
  subStats: { en: "Stats", zh: "属性" },
  subProgress: { en: "Progress", zh: "进度" },
  subQuestLog: { en: "Quest Log", zh: "任务日志" },
  subCodex: { en: "Codex", zh: "典籍" },
  subEssays: { en: "Essays", zh: "随笔" },
  subAchievements: { en: "Achievements", zh: "成就" },
  subRecords: { en: "Records", zh: "札记" },
  sectionCharacter: { en: "Character", zh: "角色" },
  sectionDocuments: { en: "Documents", zh: "文档" },
  sectionStats: { en: "Stats", zh: "属性" },
  sectionProgress: { en: "Progress", zh: "进度" },
  sectionQuestLog: { en: "Quest Log", zh: "任务日志" },
  sectionCodex: { en: "Codex", zh: "典籍" },
  sectionEssays: { en: "Essays", zh: "随笔" },
  sectionAchievements: { en: "Achievements", zh: "成就" },
  sectionRecords: { en: "Records", zh: "札记" },
  statusActive: { en: "active", zh: "进行中" },
  statusPending: { en: "pending", zh: "未" },
  statusCompleted: { en: "completed", zh: "已完成" },
  statusInProgress: { en: "in-progress", zh: "进行中" },
  statusOvercome: { en: "overcome", zh: "已克服" },
  targetMain: { en: "Main", zh: "主线" },
  targetSide: { en: "Side", zh: "支线" },
  statBirthday: { en: "DOB", zh: "生日" },
  statGender: { en: "SEX", zh: "性别" },
  statMBTI: { en: "MBTI", zh: "MBTI" },
  footerUpdate: { en: "Last updated: ", zh: "最近更新：" },
  severityHigh: { en: "high", zh: "高" },
  severityMedium: { en: "medium", zh: "中" },
  severityLow: { en: "low", zh: "低" },
};


/* =====================================================================
   RENDER ENGINE
   ===================================================================== */

(function() {
  'use strict';

  var currentLang = localStorage.getItem('chronicle-lang') || 'en';
  var currentMainTab = 'profile';
  var currentSubTab = null; // null means show all sub-tabs combined

  function t(val) {
    if (val == null) return '';
    if (typeof val === 'object' && !Array.isArray(val)) {
      return val[currentLang] || val.en || val.zh || '';
    }
    return val;
  }


  function formatYearMonth(dateStr) {
    if (!dateStr) return '';
    return dateStr.slice(0, 7);
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function starHTML(rating, max) {
    max = max || 5;
    var html = '<span class="star-rating">';
    for (var i = 1; i <= max; i++) {
      if (i <= rating) {
        html += '<span class="star filled">\u2605</span>';
      } else {
        html += '<span class="star empty">\u2606</span>';
      }
    }
    html += '</span>';
    return html;
  }

  // ---- Build sidebar navigation ----
  function buildNav() {
    var nav = document.getElementById('tabNav');
    nav.innerHTML = '';

    var tabs = [
      { id: 'profile', label: UI_TEXT.tabProfile, subs: [
        { id: 'character', label: UI_TEXT.subCharacter },
        { id: 'documents', label: UI_TEXT.subDocuments }
      ]},
      { id: 'vocation', label: UI_TEXT.tabVocation, subs: [
        { id: 'stats', label: UI_TEXT.subStats },
        { id: 'progress', label: UI_TEXT.subProgress },
        { id: 'codex', label: UI_TEXT.subCodex },
        { id: 'quest-log', label: UI_TEXT.subQuestLog }
      ]},
      { id: 'being', label: UI_TEXT.tabBeing, subs: [
        { id: 'essays', label: UI_TEXT.subEssays },
        { id: 'records', label: UI_TEXT.subRecords },
        { id: 'achievements', label: UI_TEXT.subAchievements }
      ]}
    ];

    tabs.forEach(function(tab) {
      var mainBtn = el('button', 'tab-btn' + (currentMainTab === tab.id ? ' active' : ''));
      mainBtn.dataset.maintab = tab.id;
      mainBtn.innerHTML = t(tab.label);
      nav.appendChild(mainBtn);

      tab.subs.forEach(function(s) {
        var isVisible = currentMainTab === tab.id;
        var isActive = isVisible && currentSubTab === s.id;
        var btn = el('button', 'sub-tab-btn' + (isVisible ? ' visible' : '') + (isActive ? ' active' : ''));
        btn.dataset.maintab = tab.id;
        btn.dataset.subtab = s.id;
        btn.textContent = t(s.label);
        nav.appendChild(btn);
      });
    });

    // Bind main tab clicks - show all combined
    nav.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentMainTab = btn.dataset.maintab;
        currentSubTab = null; // show all
        buildNav();
        renderContent();
      });
    });

    // Bind sub-tab clicks - show only that sub-tab
    nav.querySelectorAll('.sub-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentMainTab = btn.dataset.maintab;
        currentSubTab = btn.dataset.subtab;
        buildNav();
        renderContent();
      });
    });
  }

  // ---- Section heading helper ----
  function sectionHeading(labelObj) {
    return '<h2 class="section-heading"><span class="heading-icon">\u25c8</span> ' + t(labelObj) + '</h2>';
  }

  // ---- Render main panel content ----
  function renderContent() {
    var panel = document.getElementById('panelContent');
    panel.innerHTML = '';

    if (currentMainTab === 'vocation') {
      renderVocation(panel);
    } else if (currentMainTab === 'profile') {
      renderProfileTab(panel);
    } else if (currentMainTab === 'being') {
      renderBeing(panel);
    }
  }

  function renderProfileTab(panel) {
    var showAll = currentSubTab === null;

    if (showAll || currentSubTab === 'character') {
      panel.innerHTML += '<div id="characterSection">' + sectionHeading(UI_TEXT.sectionCharacter) + '<div class="profile-card" id="profileCard"></div></div>';
    }
    if (showAll || currentSubTab === 'documents') {
      panel.innerHTML += '<div id="documentsSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionDocuments) + '<div class="files-list" id="filesList"></div></div>';
    }

    if (document.getElementById('profileCard')) renderProfile();
    if (document.getElementById('filesList')) renderFiles();
  }

  function renderVocation(panel) {
    var showAll = currentSubTab === null;

    if (showAll || currentSubTab === 'stats') {
      panel.innerHTML += '<div id="statsSection">' + sectionHeading(UI_TEXT.sectionStats) + '<div class="stats-grid" id="statsGrid"></div></div>';
    }
    if (showAll || currentSubTab === 'progress') {
      panel.innerHTML += '<div id="progressSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionProgress) + '<div class="skills-grid" id="progressGrid"></div></div>';
    }
    if (showAll || currentSubTab === 'codex') {
      panel.innerHTML += '<div id="codexSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionCodex) + '<div class="codex-grid" id="codexGrid"></div></div>';
    }
    if (showAll || currentSubTab === 'quest-log') {
      panel.innerHTML += '<div id="questLogSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionQuestLog) + '<div class="targets-list" id="targetsList"></div></div>';
    }

    if (document.getElementById('statsGrid')) renderStats();
    if (document.getElementById('progressGrid')) renderProgress();
    if (document.getElementById('codexGrid')) renderCodex();
    if (document.getElementById('targetsList')) renderQuestLog();
  }

  function renderBeing(panel) {
    var showAll = currentSubTab === null;

    if (showAll || currentSubTab === 'essays') {
      panel.innerHTML += '<div id="essaysSection">' + sectionHeading(UI_TEXT.sectionEssays) + '<div class="posts-list" id="postsList"></div></div>';
    }
    if (showAll || currentSubTab === 'records') {
      panel.innerHTML += '<div id="recordsSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionRecords) + '<div class="records-list" id="recordsList"></div></div>';
    }
    if (showAll || currentSubTab === 'achievements') {
      panel.innerHTML += '<div id="achievementsSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionAchievements) + '<div class="achievements-list" id="achievementsList"></div></div>';
    }

    if (document.getElementById('postsList')) renderEssays();
    if (document.getElementById('recordsList')) renderRecords();
    if (document.getElementById('achievementsList')) renderAchievements();
  }

  // ---- Render header ----
  function renderHeader() {
    document.getElementById('siteTitle').textContent = t(SITE_DATA.site.title);
    document.getElementById('siteSubtitle').textContent = t(SITE_DATA.site.subtitle);
    document.getElementById('footerText').textContent = t(UI_TEXT.footerUpdate) + SITE_DATA.site.lastUpdate;
    document.title = t(SITE_DATA.site.title);
  }

  // ---- Render profile ----
  function renderProfile() {
    var p = SITE_DATA.character;
    var avatarHTML = p.avatar
      ? '<img src="' + p.avatar + '" alt="' + t(p.name) + '">'
      : '<div class="avatar-placeholder">\u2694</div>';

    var linksHTML = p.links.map(function(l) {
      var detailText = l.url;
      if (l.label === 'GitHub') {
        detailText = l.url.replace(/^https?:\/\/github\.com\//, 'github.com/');
      }
      if (l.label === 'Email') {
        detailText = l.url.replace(/^mailto:/, '');
      }
      if (l.type === 'text') {
        return '<span class="profile-link-text"><span>' + l.icon + '</span> ' + t(l.label) + ': ' + detailText + '</span>';
      }
      return '<a href="' + l.url + '" class="profile-link" target="_blank" rel="noopener"><span>' + l.icon + '</span> ' + t(l.label) + ': ' + detailText + '</a>';
    }).join('');

    var statsHTML = '<div class="profile-stats">' +
      '<span class="profile-stat"><span class="stat-label">' + t(UI_TEXT.statBirthday) + '</span> <span class="stat-value">' + p.birthday + '</span></span>' +
      '<span class="profile-stat"><span class="stat-label">' + t(UI_TEXT.statGender) + '</span> <span class="stat-value">' + t(p.gender) + '</span></span>' +
      '<span class="profile-stat"><span class="stat-label">' + t(UI_TEXT.statMBTI) + '</span> <span class="stat-value">' + p.mbti + '</span></span>' +
      '</div>';

    document.getElementById('profileCard').innerHTML =
      '<div class="avatar-frame">' + avatarHTML + '<span class="level-badge">' + t(p.level) + '</span></div>' +
      '<div class="profile-info">' +
        (currentLang === 'zh'
          ? '<h2 class="profile-name">' + t(p.name) + '</h2>'
          : '<h2 class="profile-name">' + p.nameEn + '</h2>') +
        '<p class="profile-title">' + t(p.title) + '</p>' +
        statsHTML +
        '<p class="profile-bio">' + t(p.bio) + '</p>' +
        '<div class="profile-links">' + linksHTML + '</div>' +
      '</div>';
  }

  // ---- Render stats (star ratings) ----
  function renderStats() {
    var grouped = {};
    SITE_DATA.stats.forEach(function(s) {
      var cat = t(s.categoryName);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });

    var html = '';
    for (var cat in grouped) {
      html += '<div class="stat-category-title">' + cat + '</div>';
      grouped[cat].forEach(function(s) {
        html += '<div class="stat-item"><span class="stat-name">' + t(s.name) + '</span>' + starHTML(s.rating) + '</div>';
      });
    }

    document.getElementById('statsGrid').innerHTML = html;
  }

  // ---- Render progress ----
  function renderProgress() {
    var grouped = {};
    SITE_DATA.progress.forEach(function(s) {
      var cat = t(s.categoryName) || s.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });

    var html = '';
    for (var cat in grouped) {
      html += '<div class="skill-category-title">' + cat + '</div>';
      grouped[cat].forEach(function(s) {
        var levelText = s.level === 0 ? 'Exploring' : (s.level + '/100');
        var dateText = s.date ? formatYearMonth(s.date) : '';
        html += '<div class="skill-item">' +
          '<div class="skill-top-row">' +
            '<span class="skill-name">' + t(s.name) + '</span>' +
            '<span class="skill-level">' + levelText + '</span>' +
          '</div>' +
          '<div class="skill-bar"><div class="skill-bar-fill" data-level="' + s.level + '"></div></div>' +
          (dateText ? '<div class="skill-meta-row"><span class="skill-date">' + dateText + '</span></div>' : '') +
        '</div>';
      });
    }

    document.getElementById('progressGrid').innerHTML = html;

    requestAnimationFrame(function() {
      setTimeout(function() {
        document.querySelectorAll('.skill-bar-fill').forEach(function(bar) {
          bar.style.width = bar.dataset.level + '%';
        });
      }, 200);
    });
  }

  // ---- Render codex (GitHub repos) ----
  var LANG_COLORS = {
    'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
    'Rust': '#dea584', 'Go': '#00ADD8', 'C++': '#f34b7d', 'C': '#555555',
    'Java': '#b07219', 'HTML': '#e34c26', 'CSS': '#563d7c', 'Shell': '#89e051',
    'Ruby': '#701516', 'Swift': '#F05138', 'Kotlin': '#A97BFF', 'Dart': '#00B4AB',
    'Lua': '#000080', 'Vue': '#41b883', 'Svelte': '#ff3e00'
  };

  function renderCodex() {
    var repos = (SITE_DATA.repos || []).filter(function(r) { return r.featured; }).slice(0, 20);

    var html = repos.map(function(repo) {
      var langColor = LANG_COLORS[repo.language] || '#8a7e6e';
      var dateHTML = repo.date ? '<span class="codex-date">' + formatYearMonth(repo.date) + '</span>' : '';
      return '<a href="' + repo.url + '" class="codex-card" target="_blank" rel="noopener">' +
        '<div class="codex-header">' +
          '<span class="codex-icon">\u{1F4DC}</span>' +
          '<span class="codex-name">' + repo.name + '</span>' +
        '</div>' +
        '<div class="codex-desc">' + t(repo.description) + '</div>' +
        '<div class="codex-footer">' +
          '<span class="codex-lang">' +
            '<span class="codex-lang-dot" style="background:' + langColor + '"></span>' +
            repo.language +
          '</span>' +
          dateHTML +
        '</div>' +
      '</a>';
    }).join('');

    document.getElementById('codexGrid').innerHTML = html;
  }

  // ---- Render files ----
  function renderFiles() {
    var html = SITE_DATA.files.map(function(f) {
      return '<a href="' + f.url + '" class="file-item" target="_blank" rel="noopener">' +
        '<span class="file-icon">' + f.icon + '</span>' +
        '<div class="file-info"><div class="file-name">' + t(f.name) + '</div><div class="file-desc">' + t(f.description) + '</div></div>' +
      '</a>';
    }).join('');

    document.getElementById('filesList').innerHTML = html;
  }

  // ---- Render essays ----
  function renderEssays() {
    var sorted = SITE_DATA.essays.slice().sort(function(a, b) { return b.date.localeCompare(a.date); });
    var html = sorted.map(function(p, idx) {
      var tagsHTML = p.tags.map(function(tg) { return '<span class="tag">' + t(tg) + '</span>'; }).join('');
      return '<div class="post-item" data-index="' + SITE_DATA.essays.indexOf(p) + '">' +
        '<h3 class="post-title-text">' + t(p.title) + '</h3>' +
        '<p class="post-summary">' + t(p.summary) + '</p>' +
        '<div class="post-foot">' +
          '<div class="post-tags">' + tagsHTML + '</div>' +
          '<span class="post-date">' + p.date + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    document.getElementById('postsList').innerHTML = html;

    document.querySelectorAll('.post-item').forEach(function(el) {
      el.addEventListener('click', function() { openEssayModal(parseInt(el.dataset.index)); });
    });
  }

  // ---- Render records ----
  function renderRecords() {
    var html = SITE_DATA.records.map(function(l, i) {
      var actual = l.progress != null ? l.progress : 0;
      var reached = actual >= l.count;
      var displayProgress = reached ? l.count : actual;
      var pct = l.count ? (reached ? 100 : Math.round(actual / l.count * 100)) : 0;
      var dateText = l.date ? formatYearMonth(l.date) : '';

      return '<div class="list-card" data-record="' + i + '">' +
        '<div class="list-top">' +
          '<span class="list-title">' + t(l.title) + '</span>' +
        '</div>' +
        (l.count ? '<div class="list-bar-area">' +
          '<div class="skill-bar"><div class="skill-bar-fill" data-level="' + pct + '"></div></div>' +
          '<div class="list-bar-info">' +
            '<span class="list-progress-text">' + displayProgress + ' / ' + l.count + '</span>' +
            (dateText ? '<span class="list-date">' + dateText + '</span>' : '') +
          '</div>' +
        '</div>' : '') +
      '</div>';
    }).join('');

    document.getElementById('recordsList').innerHTML = html;

    requestAnimationFrame(function() {
      setTimeout(function() {
        document.querySelectorAll('#recordsList .skill-bar-fill').forEach(function(bar) {
          bar.style.width = bar.dataset.level + '%';
        });
      }, 200);
    });

    document.querySelectorAll('.list-card').forEach(function(card) {
      card.addEventListener('click', function() {
        openRecordModal(parseInt(card.dataset.record));
      });
    });
  }

  // ---- Render achievements ----
  function renderAchievements() {
    var html = (SITE_DATA.achievements || []).slice().sort(function(a, b) {
      return (b.date || '').localeCompare(a.date || '');
    }).map(function(ach) {
      var descHTML = ach.description ? '<div class="achievement-desc">' + t(ach.description) + '</div>' : '';
      return '<div class="achievement-card">' +
        '<div class="achievement-top">' +
          '<span class="achievement-icon">\u2726</span>' +
          '<span class="achievement-title">' + t(ach.title) + '</span>' +
          '<span class="achievement-status">' + t(UI_TEXT.statusCompleted) + '</span>' +
        '</div>' +
        descHTML +
        '<div class="achievement-bottom">' +
          '<span class="achievement-date">' + formatYearMonth(ach.date) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    document.getElementById('achievementsList').innerHTML = html;
  }

  // ---- Render quest log ----
  function renderQuestLog() {
    var phaseLabels = {
      'pending': UI_TEXT.statusPending,
      'active': UI_TEXT.statusActive,
      'completed': UI_TEXT.statusCompleted
    };
    var html = SITE_DATA.targets.slice().sort(function(a, b) { return b.startDate.localeCompare(a.startDate); }).map(function(tgt) {
      var phaseText = phaseLabels[tgt.status] ? t(phaseLabels[tgt.status]) : tgt.status;
      return '<div class="target-card phase-' + tgt.status + '">' +
        '<div class="target-top">' +
          '<span class="target-title">' + t(tgt.title) + '</span>' +
          '<span class="target-status-badge">' + phaseText + '</span>' +
        '</div>' +
        '<div class="target-desc">' + t(tgt.description) + '</div>' +
        '<div class="target-bar-area">' +
          '<div class="skill-bar"><div class="skill-bar-fill" data-level="' + tgt.progress + '"></div></div>' +
          '<span class="target-pct">' + tgt.progress + '%</span>' +
        '</div>' +
        '<div class="target-bottom">' +
          '<span class="target-date">' + formatYearMonth(tgt.startDate) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    document.getElementById('targetsList').innerHTML = html;

    requestAnimationFrame(function() {
      setTimeout(function() {
        document.querySelectorAll('#targetsList .skill-bar-fill').forEach(function(bar) {
          bar.style.width = bar.dataset.level + '%';
        });
      }, 200);
    });
  }

  // ---- Record modal ----
  function openRecordModal(index) {
    var list = SITE_DATA.records[index];
    if (!list || !list.items || list.items.length === 0) return;

    document.getElementById('modalTitle').textContent = t(list.title);
    var actual = list.progress != null ? list.progress : 0;
    var reached = actual >= list.count;
    var displayProgress = reached ? list.count : actual;
    document.getElementById('modalMeta').textContent = displayProgress + ' / ' + list.count;

    var bodyHTML = '<ol class="list-modal-items">';
    list.items.forEach(function(item, i) {
      var done = reached || i < actual;
      bodyHTML += '<li class="list-modal-item' + (done ? ' done' : '') + '">' +
        '<span class="list-item-num">' + (i + 1) + '</span>' +
        '<span class="list-item-text">' + t(item) + '</span>' +
        (done ? '<span class="list-item-check">\u2713</span>' : '') +
      '</li>';
    });
    bodyHTML += '</ol>';

    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalTags').innerHTML = '';

    document.getElementById('postModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // ---- Essay modal ----
  function openEssayModal(index) {
    var post = SITE_DATA.essays[index];
    if (!post) return;

    document.getElementById('modalTitle').textContent = t(post.title);
    document.getElementById('modalMeta').textContent = post.date;
    document.getElementById('modalBody').innerHTML = t(post.content)
      .split('\n\n')
      .map(function(p) { return '<p>' + p + '</p>'; })
      .join('');
    document.getElementById('modalTags').innerHTML = post.tags
      .map(function(tg) { return '<span class="tag">' + t(tg) + '</span>'; })
      .join('');

    document.getElementById('postModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('postModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('postModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // ---- Theme toggle ----
  var toggle = document.getElementById('themeToggle');
  var icon = toggle.querySelector('.toggle-icon');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    icon.textContent = theme === 'dark' ? '\u263d' : '\u2600';
    localStorage.setItem('chronicle-theme', theme);
  }

  toggle.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  var savedTheme = localStorage.getItem('chronicle-theme');
  if (savedTheme) setTheme(savedTheme);

  // ---- Language toggle ----
  var langToggle = document.getElementById('langToggle');

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('chronicle-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    langToggle.querySelectorAll('.lang-option').forEach(function(el) {
      el.classList.toggle('active', el.dataset.lang === lang);
    });

    renderHeader();
    buildNav();
    renderContent();
  }

  langToggle.addEventListener('click', function() {
    setLang(currentLang === 'en' ? 'zh' : 'en');
  });

  // ---- Initialize ----
  loadSiteData()
    .then(function() {
      setLang(currentLang);
    })
    .catch(function(err) {
      console.error('Chronicle data not found. Please ensure database/profile.json, database/vocation.json, and database/being.json are readable.', err);
    });

  // ---- Subscribe system ----
  var SUB_CONFIG = {
    owner: 'miracleyang-dev',
    repo: 'miracleyang-dev.github.io',
    // Cloudflare Worker proxy URL
    workerUrl: 'https://chronicle-sub.13235595638.workers.dev'
  };

  var subTexts = {
    titleSubscribe: { en: 'Follow', zh: '关注' },
    titleUnsubscribe: { en: 'Unfollow', zh: '取消关注' },
    descSubscribe: { en: 'Enter your email to get notified when new content is published.', zh: '留下邮箱，有新内容更新时会收到通知。' },
    descUnsubscribe: { en: 'Enter the email you subscribed with to unfollow.', zh: '输入订阅时使用的邮箱来取消关注。' },
    btnSubscribe: { en: 'Subscribe', zh: '订阅' },
    btnUnsubscribe: { en: 'Unsubscribe', zh: '取消订阅' },
    btnFollow: { en: 'Follow', zh: '关注' },
    switchToUnsub: { en: 'Want to unsubscribe?', zh: '想取消关注？' },
    switchToSub: { en: 'Want to subscribe?', zh: '想要关注？' },
    msgSuccess: { en: 'Subscribed! You will be notified of updates.', zh: '订阅成功！有更新时会通知你。' },
    msgUnsubSuccess: { en: 'Unsubscribed. You will no longer receive notifications.', zh: '已取消关注，后续不会再收到通知。' },
    msgAlready: { en: 'This email is already subscribed.', zh: '该邮箱已经订阅过了。' },
    msgNotFound: { en: 'This email is not subscribed.', zh: '该邮箱没有订阅记录。' },
    msgInvalid: { en: 'Please enter a valid email address.', zh: '请输入有效的邮箱地址。' },
    msgNoToken: { en: 'Subscribe service is not configured yet.', zh: '订阅服务尚未配置。' },
    msgError: { en: 'Something went wrong. Please try again later.', zh: '出了点问题，请稍后再试。' },
    msgSending: { en: 'Processing...', zh: '处理中...' }
  };

  var subMode = 'subscribe'; // 'subscribe' or 'unsubscribe'

  function st(key) { return subTexts[key] ? (subTexts[key][currentLang] || subTexts[key].en) : ''; }

  function updateSubModalUI() {
    var isSub = subMode === 'subscribe';
    document.getElementById('subModalTitle').textContent = st(isSub ? 'titleSubscribe' : 'titleUnsubscribe');
    document.getElementById('subModalDesc').textContent = st(isSub ? 'descSubscribe' : 'descUnsubscribe');
    document.getElementById('subSubmit').textContent = st(isSub ? 'btnSubscribe' : 'btnUnsubscribe');
    document.getElementById('subToggleMode').textContent = st(isSub ? 'switchToUnsub' : 'switchToSub');
    document.getElementById('subscribeBtnText').textContent = st('btnFollow');
    document.getElementById('subMsg').textContent = '';
    document.getElementById('subMsg').className = 'sub-msg';
    document.getElementById('subEmail').value = '';
  }

  function openSubModal() {
    subMode = 'subscribe';
    updateSubModalUI();
    document.getElementById('subModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { document.getElementById('subEmail').focus(); }, 100);
  }

  function closeSubModal() {
    document.getElementById('subModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('subscribeBtn').addEventListener('click', openSubModal);
  document.getElementById('subModalClose').addEventListener('click', closeSubModal);
  document.getElementById('subModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeSubModal();
  });

  document.getElementById('subToggleMode').addEventListener('click', function() {
    subMode = subMode === 'subscribe' ? 'unsubscribe' : 'subscribe';
    updateSubModalUI();
  });

  function showSubMsg(key, type) {
    var el = document.getElementById('subMsg');
    el.textContent = st(key);
    el.className = 'sub-msg ' + type;
  }

  function ghAPI(method, path, body) {
    var url = SUB_CONFIG.workerUrl + path;
    var opts = {
      method: method,
      headers: {
        'Accept': 'application/vnd.github+json'
      }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function(r) {
      if (r.status === 204) return null;
      return r.json().then(function(data) {
        data._status = r.status;
        return data;
      });
    });
  }

  function findIssueByEmail(email) {
    var q = encodeURIComponent('[subscribe] ' + email + ' repo:' + SUB_CONFIG.owner + '/' + SUB_CONFIG.repo + ' is:issue is:open');
    return ghAPI('GET', '/search/issues?q=' + q + '&per_page=5').then(function(data) {
      if (!data || !data.items) return null;
      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].title === '[subscribe] ' + email) return data.items[i];
      }
      return null;
    });
  }

  document.getElementById('subSubmit').addEventListener('click', function() {
    var email = document.getElementById('subEmail').value.trim().toLowerCase();
    var submitBtn = document.getElementById('subSubmit');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showSubMsg('msgInvalid', 'error');
      return;
    }
    if (!SUB_CONFIG.workerUrl) {
      showSubMsg('msgNoToken', 'error');
      return;
    }

    submitBtn.disabled = true;
    showSubMsg('msgSending', 'info');

    if (subMode === 'subscribe') {
      findIssueByEmail(email).then(function(existing) {
        if (existing) {
          showSubMsg('msgAlready', 'info');
          submitBtn.disabled = false;
          return;
        }
        return ghAPI('POST', '/repos/' + SUB_CONFIG.owner + '/' + SUB_CONFIG.repo + '/issues', {
          title: '[subscribe] ' + email,
          body: 'Subscribed at: ' + new Date().toISOString() + '\nSource: ' + location.href,
          labels: ['subscribe']
        }).then(function(res) {
          if (res && res.id) {
            showSubMsg('msgSuccess', 'success');
            document.getElementById('subEmail').value = '';
          } else {
            showSubMsg('msgError', 'error');
          }
          submitBtn.disabled = false;
        });
      }).catch(function() {
        showSubMsg('msgError', 'error');
        submitBtn.disabled = false;
      });

    } else {
      findIssueByEmail(email).then(function(issue) {
        if (!issue) {
          showSubMsg('msgNotFound', 'error');
          submitBtn.disabled = false;
          return;
        }
        return ghAPI('PATCH', '/repos/' + SUB_CONFIG.owner + '/' + SUB_CONFIG.repo + '/issues/' + issue.number, {
          state: 'closed'
        }).then(function() {
          showSubMsg('msgUnsubSuccess', 'success');
          document.getElementById('subEmail').value = '';
          submitBtn.disabled = false;
        });
      }).catch(function() {
        showSubMsg('msgError', 'error');
        submitBtn.disabled = false;
      });
    }
  });

  // Allow Enter key to submit
  document.getElementById('subEmail').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('subSubmit').click();
  });

  // ESC closes subscribe modal too
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('subModal').classList.contains('open')) {
      closeSubModal();
    }
  });

  // Update subscribe button text on language change (hook into existing setLang)
  var origSetLang = setLang;
  setLang = function(lang) {
    origSetLang(lang);
    document.getElementById('subscribeBtnText').textContent = st('btnFollow');
  };

})();
