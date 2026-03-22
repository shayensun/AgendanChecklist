const STORAGE_KEY = 'agendan-checklist-state';

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
};

const state = {
  currentView: 'dashboard',
  currentModalType: 'event',
  selectedDate: formatDate(new Date()),
  calendarDate: startOfMonth(new Date()),
  editing: null,
  data: loadState(),
};

const refs = {
  navTabs: document.querySelectorAll('.nav-tab'),
  views: {
    dashboard: document.getElementById('dashboardView'),
    calendar: document.getElementById('calendarView'),
    trackers: document.getElementById('trackersView'),
  },
  todayHeading: document.getElementById('todayHeading'),
  todaySubheading: document.getElementById('todaySubheading'),
  sidebarSummary: document.getElementById('sidebarSummary'),
  todayEvents: document.getElementById('todayEvents'),
  todayTrackers: document.getElementById('todayTrackers'),
  todayLogs: document.getElementById('todayLogs'),
  calendarHeading: document.getElementById('calendarHeading'),
  calendarGrid: document.getElementById('calendarGrid'),
  selectedDateHeading: document.getElementById('selectedDateHeading'),
  selectedDayEvents: document.getElementById('selectedDayEvents'),
  selectedDayHabits: document.getElementById('selectedDayHabits'),
  selectedDayLogs: document.getElementById('selectedDayLogs'),
  trackerManagementList: document.getElementById('trackerManagementList'),
  quickAddButton: document.getElementById('quickAddButton'),
  headerAddButton: document.getElementById('headerAddButton'),
  jumpTodayButton: document.getElementById('jumpTodayButton'),
  prevMonthButton: document.getElementById('prevMonthButton'),
  nextMonthButton: document.getElementById('nextMonthButton'),
  addForSelectedDate: document.getElementById('addForSelectedDate'),
  modalOverlay: document.getElementById('entryModalOverlay'),
  closeModalButton: document.getElementById('closeModalButton'),
  cancelModalButton: document.getElementById('cancelModalButton'),
  entryTypeSwitch: document.getElementById('entryTypeSwitch'),
  modalTitle: document.getElementById('modalTitle'),
  entryForm: document.getElementById('entryForm'),
  formAlert: document.getElementById('formAlert'),
  openModalButtons: document.querySelectorAll('[data-open-modal]'),
};

initialize();

function initialize() {
  populateTimeOptions();
  bindEvents();
  seedDefaultDates();
  render();
}

function loadState() {
  const sample = buildSampleState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sample;
    const parsed = JSON.parse(raw);
    return {
      events: parsed.events ?? sample.events,
      trackers: parsed.trackers ?? sample.trackers,
      habitRecords: parsed.habitRecords ?? sample.habitRecords,
      logs: parsed.logs ?? sample.logs,
    };
  } catch (error) {
    console.warn('Failed to load state, using sample data.', error);
    return sample;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function buildSampleState() {
  const today = new Date();
  const todayStr = formatDate(today);
  const tomorrow = formatDate(addDays(today, 1));
  const monthStart = formatDate(startOfMonth(today));

  const trackerA = createId('tracker');
  const trackerB = createId('tracker');
  const trackerC = createId('tracker');

  return {
    events: [
      {
        id: createId('event'),
        title: '晨间计划整理',
        date: todayStr,
        startTime: '08:30 AM',
        endTime: '09:00 AM',
        allDay: false,
        category: '学习',
        location: 'Home',
        notes: '快速确认今天最重要的 3 件事。',
      },
      {
        id: createId('event'),
        title: '瑜伽课',
        date: tomorrow,
        startTime: '07:00 PM',
        endTime: '08:00 PM',
        allDay: false,
        category: '健康',
        location: 'Gym',
        notes: '提前 10 分钟到。',
      },
    ],
    trackers: [
      {
        id: trackerA,
        name: '喝水',
        frequency: 'daily',
        icon: '💧',
        color: '#62c6ff',
        reminderTime: '10:00 AM',
        notes: '至少 8 杯水',
        type: 'normal',
        startDate: monthStart,
      },
      {
        id: trackerB,
        name: '运动',
        frequency: 'weekly',
        icon: '🏃',
        color: '#8dd39e',
        reminderTime: '07:00 PM',
        notes: '每周至少 3 次。',
        type: 'health',
        startDate: monthStart,
      },
      {
        id: trackerC,
        name: '月经记录',
        frequency: 'daily',
        icon: '🩷',
        color: '#ff7aa2',
        reminderTime: '',
        notes: '可连续记录多天与症状。',
        type: 'period',
        startDate: monthStart,
      },
    ],
    habitRecords: [
      { id: createId('record'), trackerId: trackerA, date: todayStr, completed: true, value: null },
      { id: createId('record'), trackerId: trackerB, date: todayStr, completed: false, value: null },
    ],
    logs: [
      {
        id: createId('log'),
        date: todayStr,
        text: '今天心情不错，准备把这个三合一日程工具的 MVP 做出来。',
        mood: '开心',
        tag: '成就',
      },
    ],
  };
}

function seedDefaultDates() {
  const today = formatDate(new Date());
  refs.entryForm.elements.eventDate.value = state.selectedDate || today;
  refs.entryForm.elements.logDate.value = state.selectedDate || today;
  refs.entryForm.elements.trackerStartDate.value = today;
}

function populateTimeOptions() {
  const timeOptions = buildTimeOptions();
  ['eventStartTime', 'eventEndTime', 'trackerReminderTime'].forEach((name) => {
    const select = refs.entryForm.elements[name];
    select.innerHTML = '';
    if (name === 'trackerReminderTime') {
      select.append(new Option('不提醒', ''));
    }
    timeOptions.forEach((time) => select.append(new Option(time, time)));
  });

  refs.entryForm.elements.eventStartTime.value = '09:00 AM';
  refs.entryForm.elements.eventEndTime.value = '10:00 AM';
}

function buildTimeOptions() {
  const options = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const displayHour = ((hour + 11) % 12) + 1;
      const meridiem = hour < 12 ? 'AM' : 'PM';
      options.push(`${displayHour}:${String(minute).padStart(2, '0')} ${meridiem}`);
    }
  }
  return options;
}

function bindEvents() {
  refs.navTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  refs.quickAddButton.addEventListener('click', () => openModal('event'));
  refs.headerAddButton.addEventListener('click', () => openModal(state.currentModalType));
  refs.jumpTodayButton.addEventListener('click', () => jumpToToday());
  refs.prevMonthButton.addEventListener('click', () => changeMonth(-1));
  refs.nextMonthButton.addEventListener('click', () => changeMonth(1));
  refs.addForSelectedDate.addEventListener('click', () => {
    openModal('event');
    refs.entryForm.elements.eventDate.value = state.selectedDate;
    refs.entryForm.elements.logDate.value = state.selectedDate;
  });

  refs.openModalButtons.forEach((button) => {
    button.addEventListener('click', () => openModal(button.dataset.openModal));
  });

  refs.entryTypeSwitch.querySelectorAll('.switch-chip').forEach((chip) => {
    chip.addEventListener('click', () => setModalType(chip.dataset.type));
  });

  refs.closeModalButton.addEventListener('click', closeModal);
  refs.cancelModalButton.addEventListener('click', closeModal);
  refs.modalOverlay.addEventListener('click', (event) => {
    if (event.target === refs.modalOverlay) closeModal();
  });

  refs.entryForm.addEventListener('submit', handleSubmit);

  document.addEventListener('click', (event) => {
    const { action, id, date, type } = event.target.dataset;
    if (!action) return;

    if (action === 'select-date') {
      state.selectedDate = date;
      render();
      return;
    }

    if (action === 'toggle-record') {
      toggleHabitRecord(id, date);
      return;
    }

    if (action === 'edit-item') {
      startEdit(type, id);
      return;
    }

    if (action === 'delete-item') {
      deleteItem(type, id);
    }
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  refs.navTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewName));
  Object.entries(refs.views).forEach(([name, view]) => {
    view.classList.toggle('active', name === viewName);
    view.style.display = name === viewName ? 'block' : 'none';
  });
}

function openModal(type) {
  refs.modalOverlay.classList.remove('hidden');
  refs.formAlert.classList.add('hidden');
  refs.formAlert.textContent = '';
  setModalType(type);

  if (!state.editing) {
    refs.entryForm.reset();
    populateTimeOptions();
    seedDefaultDates();
    refs.entryForm.elements.eventDate.value = state.selectedDate;
    refs.entryForm.elements.logDate.value = state.selectedDate;
  }
}


function closeModal() {
  refs.modalOverlay.classList.add('hidden');
  state.editing = null;
  refs.entryForm.reset();
  populateTimeOptions();
  seedDefaultDates();
}


function setModalType(type) {
  state.currentModalType = type;
  const modeText = state.editing?.type === type ? '编辑' : '新增';
  refs.modalTitle.textContent = `${modeText} ${type === 'event' ? '行程' : type === 'tracker' ? '打卡项' : '日常记录'}`;
  refs.entryTypeSwitch.querySelectorAll('.switch-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.type === type);
  });
  document.querySelectorAll('.form-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === type);
  });
}

function handleSubmit(event) {
  event.preventDefault();

  try {
    if (state.currentModalType === 'event') {
      submitEvent();
    } else if (state.currentModalType === 'tracker') {
      submitTracker();
    } else {
      submitLog();
    }
    saveState();
    closeModal();
    render();
  } catch (error) {
    refs.formAlert.textContent = error.message;
    refs.formAlert.classList.remove('hidden');
  }
}

function submitEvent() {
  const form = refs.entryForm.elements;
  const allDay = form.eventAllDay.checked;
  const item = {
    id: state.editing?.type === 'event' ? state.editing.id : createId('event'),
    title: form.eventTitle.value.trim(),
    date: form.eventDate.value,
    startTime: allDay ? '' : form.eventStartTime.value,
    endTime: allDay ? '' : form.eventEndTime.value,
    allDay,
    category: form.eventCategory.value,
    location: form.eventLocation.value.trim(),
    notes: form.eventNotes.value.trim(),
  };

  if (!item.title || !item.date) throw new Error('请先填写标题与日期。');

  if (!allDay && timeToMinutes(item.endTime) <= timeToMinutes(item.startTime)) {
    throw new Error('结束时间必须晚于开始时间。');
  }

  const conflict = state.data.events.find((eventItem) => {
    if (eventItem.id === item.id) return false;
    if (eventItem.date !== item.date || eventItem.allDay || allDay) return false;
    return timeToMinutes(item.startTime) < timeToMinutes(eventItem.endTime)
      && timeToMinutes(item.endTime) > timeToMinutes(eventItem.startTime);
  });

  if (conflict) {
    throw new Error(`时间冲突：与「${conflict.title}」重叠，请调整时间。`);
  }

  upsertItem('events', item);
}

function submitTracker() {
  const form = refs.entryForm.elements;
  const item = {
    id: state.editing?.type === 'tracker' ? state.editing.id : createId('tracker'),
    name: form.trackerName.value.trim(),
    icon: form.trackerIcon.value.trim() || '✨',
    frequency: form.trackerFrequency.value,
    type: form.trackerType.value,
    color: form.trackerColor.value,
    reminderTime: form.trackerReminderTime.value,
    notes: form.trackerNotes.value.trim(),
    startDate: form.trackerStartDate.value,
  };

  if (!item.name || !item.startDate) throw new Error('请填写打卡项名称与起始日期。');
  upsertItem('trackers', item);
}

function submitLog() {
  const form = refs.entryForm.elements;
  const item = {
    id: state.editing?.type === 'log' ? state.editing.id : createId('log'),
    date: form.logDate.value,
    mood: form.logMood.value,
    tag: form.logTag.value.trim(),
    text: form.logText.value.trim(),
  };

  if (!item.date || !item.text) throw new Error('请填写日志日期与内容。');
  upsertItem('logs', item, true);
}

function render() {
  switchView(state.currentView);
  renderHeader();
  renderSidebarSummary();
  renderDashboard();
  renderCalendar();
  renderSelectedDay();
  renderTrackerManagement();
}

function renderHeader() {
  const today = new Date();
  refs.todayHeading.textContent = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const dueTrackers = getTrackersForDate(formatDate(today));
  refs.todaySubheading.textContent = `今天有 ${getEventsByDate(formatDate(today)).length} 个行程，${dueTrackers.length} 个需要关注的打卡项。`;
}

function renderSidebarSummary() {
  const today = formatDate(new Date());
  const pendingToday = getTrackersForDate(today).filter((tracker) => !isTrackerCompleted(tracker.id, today)).length;
  const cards = [
    { label: '今日行程', value: getEventsByDate(today).length },
    { label: '待完成打卡', value: pendingToday },
    { label: '今日记录', value: getLogsByDate(today).length },
  ];

  refs.sidebarSummary.innerHTML = cards
    .map(
      (card) => `
        <div class="summary-pill">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
        </div>
      `,
    )
    .join('');
}

function renderDashboard() {
  const today = formatDate(new Date());
  renderEventList(refs.todayEvents, getEventsByDate(today), true);
  renderHabitList(refs.todayTrackers, getTrackersForDate(today), today, true);
  renderLogList(refs.todayLogs, getLogsByDate(today));
}

function renderCalendar() {
  const current = state.calendarDate;
  refs.calendarHeading.textContent = current.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  });

  const monthStart = startOfMonth(current);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const cells = weekdays.map((weekday) => `<div class="calendar-weekday">${weekday}</div>`);

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const dateStr = formatDate(date);
    const eventCount = getEventsByDate(dateStr).length;
    const logCount = getLogsByDate(dateStr).length;
    const habitCount = getCompletedHabitRecordsByDate(dateStr).length;
    const isCurrentMonth = date.getMonth() === current.getMonth();
    const isToday = dateStr === formatDate(new Date());
    const isSelected = dateStr === state.selectedDate;

    cells.push(`
      <button
        class="calendar-day ${isCurrentMonth ? '' : 'outside'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
        data-action="select-date"
        data-date="${dateStr}"
      >
        <strong>${date.getDate()}</strong>
        <div class="small-muted">${eventCount} 行程 · ${habitCount} 打卡 · ${logCount} 日志</div>
        <div class="calendar-dot-row">
          ${eventCount ? '<span class="calendar-dot" style="background:#8d7bff"></span>' : ''}
          ${habitCount ? '<span class="calendar-dot" style="background:#6ecf9a"></span>' : ''}
          ${logCount ? '<span class="calendar-dot" style="background:#ff7aa2"></span>' : ''}
        </div>
      </button>
    `);
  }

  refs.calendarGrid.innerHTML = cells.join('');
}

function renderSelectedDay() {
  refs.selectedDateHeading.textContent = new Date(`${state.selectedDate}T00:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  renderEventList(refs.selectedDayEvents, getEventsByDate(state.selectedDate));
  renderHabitList(refs.selectedDayHabits, getTrackersForDate(state.selectedDate), state.selectedDate);
  renderLogList(refs.selectedDayLogs, getLogsByDate(state.selectedDate));
}

function renderTrackerManagement() {
  if (!state.data.trackers.length) {
    refs.trackerManagementList.innerHTML = emptyState('还没有打卡项目，先创建一个常用习惯吧。');
    return;
  }

  refs.trackerManagementList.innerHTML = state.data.trackers
    .map((tracker) => {
      const stats = trackerCompletionStats(tracker);
      return `
        <article class="management-card">
          <div class="item-topline">
            <div class="badge"><span class="color-dot" style="background:${tracker.color}"></span>${tracker.icon || '✨'} ${tracker.name}</div>
            <div class="tracker-actions"><button class="text-button" data-action="edit-item" data-type="tracker" data-id="${tracker.id}">编辑</button><button class="text-button" data-action="delete-item" data-type="tracker" data-id="${tracker.id}">删除</button></div>
          </div>
          <div class="item-meta">
            <span class="frequency-badge">${frequencyLabels[tracker.frequency]}</span>
            <span class="category-badge">${tracker.type}</span>
          </div>
          <p class="small-muted">起始日期：${tracker.startDate}${tracker.reminderTime ? ` · 提醒：${tracker.reminderTime}` : ''}</p>
          <p class="note-text">${tracker.notes || '暂无备注，可用于记录目标、症状或提醒。'}</p>
          <div>
            <div class="item-meta">
              <span>完成率</span>
              <strong>${stats.rate}%</strong>
            </div>
            <div class="progress-bar"><span style="width:${stats.rate}%; background:${tracker.color}"></span></div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderEventList(container, items, compact = false) {
  if (!items.length) {
    container.innerHTML = emptyState('这一天还没有安排行程，可以添加学习、工作、生活或健康活动。');
    return;
  }

  container.innerHTML = items
    .sort(sortEvents)
    .map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <div>
            <strong>${item.title}</strong>
            <div class="small-muted">${item.allDay ? '全天' : `${item.startTime} - ${item.endTime}`}${item.location ? ` · ${item.location}` : ''}</div>
          </div>
          <div class="tracker-actions"><button class="text-button" data-action="edit-item" data-type="event" data-id="${item.id}">编辑</button><button class="text-button" data-action="delete-item" data-type="event" data-id="${item.id}">删除</button></div>
        </div>
        <div class="item-meta">
          <span class="category-badge">${item.category}</span>
          ${compact ? `<span class="small-muted">${item.date}</span>` : ''}
        </div>
        ${item.notes ? `<p class="note-text">${item.notes}</p>` : ''}
      </article>
    `)
    .join('');
}

function renderHabitList(container, trackers, date, compact = false) {
  if (!trackers.length) {
    container.innerHTML = emptyState('今天没有需要处理的打卡项，或者你还没创建新的习惯。');
    return;
  }

  container.innerHTML = trackers
    .map((tracker) => {
      const completed = isTrackerCompleted(tracker.id, date);
      return `
        <article class="item-card">
          <div class="item-topline">
            <div class="badge"><span class="color-dot" style="background:${tracker.color}"></span>${tracker.icon || '✨'} ${tracker.name}</div>
            <button class="status-button ${completed ? '' : 'pending'}" data-action="toggle-record" data-id="${tracker.id}" data-date="${date}">
              ${completed ? '已完成' : '点我打卡'}
            </button>
          </div>
          <div class="item-meta">
            <span class="frequency-badge">${frequencyLabels[tracker.frequency]}</span>
            <span class="category-badge">${tracker.type}</span>
            ${compact && tracker.reminderTime ? `<span class="small-muted">提醒 ${tracker.reminderTime}</span>` : ''}
          </div>
          ${tracker.notes ? `<p class="note-text">${tracker.notes}</p>` : ''}
        </article>
      `;
    })
    .join('');
}

function renderLogList(container, items) {
  if (!items.length) {
    container.innerHTML = emptyState('写下一点今天的生活痕迹，比如心情、见面、购物或小成就。');
    return;
  }

  container.innerHTML = items
    .map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <div>
            <strong>${item.mood || '记录'}</strong>
            <div class="small-muted">${item.tag || 'Daily Log'} · ${item.date}</div>
          </div>
          <div class="tracker-actions"><button class="text-button" data-action="edit-item" data-type="log" data-id="${item.id}">编辑</button><button class="text-button" data-action="delete-item" data-type="log" data-id="${item.id}">删除</button></div>
        </div>
        <p class="note-text">${item.text}</p>
      </article>
    `)
    .join('');
}

function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}

function upsertItem(collection, item, prepend = false) {
  const index = state.data[collection].findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    state.data[collection][index] = item;
  } else if (prepend) {
    state.data[collection].unshift(item);
  } else {
    state.data[collection].push(item);
  }
}

function startEdit(type, id) {
  const collection = type === 'event' ? 'events' : type === 'tracker' ? 'trackers' : 'logs';
  const item = state.data[collection].find((entry) => entry.id === id);
  if (!item) return;

  state.editing = { type, id };
  refs.entryForm.reset();
  populateTimeOptions();
  setModalType(type);
  refs.modalOverlay.classList.remove('hidden');

  if (type === 'event') {
    refs.entryForm.elements.eventTitle.value = item.title;
    refs.entryForm.elements.eventDate.value = item.date;
    refs.entryForm.elements.eventAllDay.checked = item.allDay;
    refs.entryForm.elements.eventStartTime.value = item.startTime || '09:00 AM';
    refs.entryForm.elements.eventEndTime.value = item.endTime || '10:00 AM';
    refs.entryForm.elements.eventCategory.value = item.category;
    refs.entryForm.elements.eventLocation.value = item.location || '';
    refs.entryForm.elements.eventNotes.value = item.notes || '';
  }

  if (type === 'tracker') {
    refs.entryForm.elements.trackerName.value = item.name;
    refs.entryForm.elements.trackerIcon.value = item.icon || '';
    refs.entryForm.elements.trackerFrequency.value = item.frequency;
    refs.entryForm.elements.trackerType.value = item.type;
    refs.entryForm.elements.trackerColor.value = item.color;
    refs.entryForm.elements.trackerReminderTime.value = item.reminderTime || '';
    refs.entryForm.elements.trackerStartDate.value = item.startDate;
    refs.entryForm.elements.trackerNotes.value = item.notes || '';
  }

  if (type === 'log') {
    refs.entryForm.elements.logDate.value = item.date;
    refs.entryForm.elements.logMood.value = item.mood || '平静';
    refs.entryForm.elements.logTag.value = item.tag || '';
    refs.entryForm.elements.logText.value = item.text;
  }
}

function getEventsByDate(date) {
  return state.data.events.filter((item) => item.date === date);
}

function getLogsByDate(date) {
  return state.data.logs.filter((item) => item.date === date);
}

function getTrackersForDate(date) {
  return state.data.trackers.filter((tracker) => trackerIsDueOnDate(tracker, date));
}

function trackerIsDueOnDate(tracker, dateStr) {
  if (dateStr < tracker.startDate) return false;
  const diffDays = daysBetween(tracker.startDate, dateStr);
  if (tracker.frequency === 'daily') return true;
  if (tracker.frequency === 'weekly') return diffDays % 7 === 0;
  if (tracker.frequency === 'biweekly') return diffDays % 14 === 0;
  if (tracker.frequency === 'monthly') {
    return new Date(`${tracker.startDate}T00:00:00`).getDate() === new Date(`${dateStr}T00:00:00`).getDate();
  }
  return false;
}

function toggleHabitRecord(trackerId, date) {
  const existing = state.data.habitRecords.find((record) => record.trackerId === trackerId && record.date === date);
  if (existing) {
    existing.completed = !existing.completed;
  } else {
    state.data.habitRecords.push({
      id: createId('record'),
      trackerId,
      date,
      completed: true,
      value: null,
    });
  }
  saveState();
  render();
}

function isTrackerCompleted(trackerId, date) {
  return Boolean(
    state.data.habitRecords.find((record) => record.trackerId === trackerId && record.date === date && record.completed),
  );
}

function getCompletedHabitRecordsByDate(date) {
  return state.data.habitRecords.filter((record) => record.date === date && record.completed);
}

function trackerCompletionStats(tracker) {
  const dueDates = [];
  const start = new Date(`${tracker.startDate}T00:00:00`);
  const today = new Date();
  for (let cursor = new Date(start); cursor <= today; cursor = addDays(cursor, 1)) {
    const date = formatDate(cursor);
    if (trackerIsDueOnDate(tracker, date)) dueDates.push(date);
  }
  const completed = dueDates.filter((date) => isTrackerCompleted(tracker.id, date)).length;
  const rate = dueDates.length ? Math.round((completed / dueDates.length) * 100) : 0;
  return { completed, due: dueDates.length, rate };
}

function deleteItem(type, id) {
  if (type === 'event') {
    state.data.events = state.data.events.filter((item) => item.id !== id);
  }
  if (type === 'tracker') {
    state.data.trackers = state.data.trackers.filter((item) => item.id !== id);
    state.data.habitRecords = state.data.habitRecords.filter((record) => record.trackerId !== id);
  }
  if (type === 'log') {
    state.data.logs = state.data.logs.filter((item) => item.id !== id);
  }
  saveState();
  render();
}

function changeMonth(offset) {
  state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + offset, 1);
  renderCalendar();
}

function jumpToToday() {
  state.selectedDate = formatDate(new Date());
  state.calendarDate = startOfMonth(new Date());
  render();
}

function sortEvents(left, right) {
  if (left.allDay && !right.allDay) return -1;
  if (!left.allDay && right.allDay) return 1;
  return timeToMinutes(left.startTime || '12:00 AM') - timeToMinutes(right.startTime || '12:00 AM');
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysBetween(startDateStr, endDateStr) {
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

function timeToMinutes(label) {
  const [time, meridiem] = label.split(' ');
  let [hour, minute] = time.split(':').map(Number);
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}
