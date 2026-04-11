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
  essays: [],
  lists: [],
  records: []
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
  subEssays: { en: "Essays", zh: "随笔" },
  subLists: { en: "Lists", zh: "清单" },
  subRecords: { en: "records", zh: "札记" },
  sectionCharacter: { en: "Character", zh: "角色" },
  sectionDocuments: { en: "Documents", zh: "文档" },
  sectionStats: { en: "Stats", zh: "属性" },
  sectionProgress: { en: "Progress", zh: "进度" },
  sectionQuestLog: { en: "Quest Log", zh: "任务日志" },
  sectionEssays: { en: "Essays", zh: "随笔" },
  sectionLists: { en: "Lists", zh: "清单" },
  sectionRecords: { en: "records", zh: "札记" },
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
  severityLow: { en: "low", zh: "低" }
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
        { id: 'quest-log', label: UI_TEXT.subQuestLog }
      ]},
      { id: 'being', label: UI_TEXT.tabBeing, subs: [
        { id: 'essays', label: UI_TEXT.subEssays },
        { id: 'lists', label: UI_TEXT.subLists },
        { id: 'records', label: UI_TEXT.subRecords }
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
    if (showAll || currentSubTab === 'quest-log') {
      panel.innerHTML += '<div id="questLogSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionQuestLog) + '<div class="targets-list" id="targetsList"></div></div>';
    }

    if (document.getElementById('statsGrid')) renderStats();
    if (document.getElementById('progressGrid')) renderProgress();
    if (document.getElementById('targetsList')) renderQuestLog();
  }

  function renderBeing(panel) {
    var showAll = currentSubTab === null;

    if (showAll || currentSubTab === 'essays') {
      panel.innerHTML += '<div id="essaysSection">' + sectionHeading(UI_TEXT.sectionEssays) + '<div class="posts-list" id="postsList"></div></div>';
    }
    if (showAll || currentSubTab === 'lists') {
      panel.innerHTML += '<div id="listsSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionLists) + '<div class="lists-list" id="listsList"></div></div>';
    }
    if (showAll || currentSubTab === 'records') {
      panel.innerHTML += '<div id="recordsSection" class="' + (showAll ? 'section-separator' : '') + '">' + sectionHeading(UI_TEXT.sectionRecords) + '<div class="records-list" id="recordsList"></div></div>';
    }

    if (document.getElementById('postsList')) renderEssays();
    if (document.getElementById('listsList')) renderLists();
    if (document.getElementById('recordsList')) renderRecords();
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

  // ---- Render skills ----
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
        html += '<div class="skill-item"><div class="skill-header"><span class="skill-name">' + t(s.name) + '</span><span class="skill-level">' + levelText + '</span></div><div class="skill-bar"><div class="skill-bar-fill" data-level="' + s.level + '"></div></div></div>';
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
      return '<div class="post-item" data-index="' + SITE_DATA.essays.indexOf(p) + '">' +
        '<div class="post-meta"><span class="post-date">' + p.date + '</span>' + p.tags.map(function(tg) { return '<span class="tag">' + t(tg) + '</span>'; }).join('') + '</div>' +
        '<h3 class="post-title-text">' + t(p.title) + '</h3>' +
        '<p class="post-summary">' + t(p.summary) + '</p>' +
      '</div>';
    }).join('');

    document.getElementById('postsList').innerHTML = html;

    document.querySelectorAll('.post-item').forEach(function(el) {
      el.addEventListener('click', function() { openEssayModal(parseInt(el.dataset.index)); });
    });
  }

  // ---- Render lists ----
  function renderLists() {
    var html = SITE_DATA.lists.map(function(l, i) {
      var progressHTML = '';
      if (l.progress != null && l.count) {
        progressHTML = '<div class="list-progress">' +
          '<div class="list-progress-label">' + l.progress + ' / ' + l.count + '</div>' +
          '<div class="skill-bar"><div class="skill-bar-fill" data-level="' + Math.round(l.progress / l.count * 100) + '"></div></div>' +
        '</div>';
      }
      return '<div class="list-card" data-list="' + i + '">' +
        '<div class="list-header">' +
          '<span class="list-title">' + t(l.title) + '</span>' +
          '<span class="list-count">' + (l.progress != null ? l.progress + '/' : '') + l.count + '</span>' +
        '</div>' +
        progressHTML +
      '</div>';
    }).join('');

    document.getElementById('listsList').innerHTML = html;

    requestAnimationFrame(function() {
      setTimeout(function() {
        document.querySelectorAll('#listsList .skill-bar-fill').forEach(function(bar) {
          bar.style.width = bar.dataset.level + '%';
        });
      }, 200);
    });

    document.querySelectorAll('.list-card').forEach(function(card) {
      card.addEventListener('click', function() {
        openListModal(parseInt(card.dataset.list));
      });
    });
  }

  // ---- Render records ----
  function renderRecords() {
    var sorted = SITE_DATA.records.slice().sort(function(a, b) { return b.date.localeCompare(a.date); });
    var html = sorted.map(function(r, i) {
      return '<div class="record-card" data-record="' + i + '">' +
        '<div class="record-header">' +
          '<span class="record-type">' + t(r.type) + '</span>' +
          '<span class="record-title">' + t(r.title) + '</span>' +
        '</div>' +
        '<div class="record-meta">' +
          '<span class="record-date">' + r.date + '</span>' +
          starHTML(r.rating) +
        '</div>' +
        '<div class="record-note">' + t(r.note) + '</div>' +
      '</div>';
    }).join('');

    document.getElementById('recordsList').innerHTML = html;

    document.querySelectorAll('.record-card').forEach(function(card) {
      card.addEventListener('click', function() {
        card.classList.toggle('expanded');
      });
    });
  }

  // ---- Render targets ----
  function renderQuestLog() {
    var phaseLabels = {
      'pending': UI_TEXT.statusPending,
      'active': UI_TEXT.statusActive,
      'completed': UI_TEXT.statusCompleted
    };
    var typeLabels = {
      'main': UI_TEXT.targetMain,
      'side': UI_TEXT.targetSide
    };
    var html = SITE_DATA.targets.slice().sort(function(a, b) { return b.startDate.localeCompare(a.startDate); }).map(function(tgt) {
      var typeHTML = '';
      if (tgt.type && typeLabels[tgt.type]) {
        typeHTML = '<span class="target-type-badge ' + tgt.type + '">' + t(typeLabels[tgt.type]) + '</span>';
      }
      var phaseText = phaseLabels[tgt.status] ? t(phaseLabels[tgt.status]) : tgt.status;
      return '<div class="target-card type-' + tgt.type + ' phase-' + tgt.status + '">' +
        '<div class="target-phase-badge">' + phaseText + '</div>' +
        '<div class="target-header">' +
          typeHTML +
          '<span class="target-title">' + t(tgt.title) + '</span>' +
        '</div>' +
        '<div class="target-desc">' + t(tgt.description) + '</div>' +
        '<div class="target-progress">' +
          '<div class="target-progress-label">' + tgt.progress + '%</div>' +
          '<div class="skill-bar"><div class="skill-bar-fill" data-level="' + tgt.progress + '"></div></div>' +
        '</div>' +
        '<div class="target-footer">' +
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

  // ---- List modal ----
  function openListModal(index) {
    var list = SITE_DATA.lists[index];
    if (!list || !list.items || list.items.length === 0) return;

    document.getElementById('modalTitle').textContent = t(list.title);
    document.getElementById('modalMeta').textContent =
      (list.progress != null ? list.progress + ' / ' : '') + list.count;

    var bodyHTML = '<ol class="list-modal-items">';
    list.items.forEach(function(item, i) {
      var done = list.progress != null && i < list.progress;
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
    if (e.key === 'Escape') closeModal();
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

})();



