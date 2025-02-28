document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search');
  const tabList = document.getElementById('tab-list');
  const tabCount = document.getElementById('tab-count');
  let allTabs = [];
  let selectedIndex = -1;

  function updateTabCount() {
    const total = allTabs.length;
    const query = searchInput.value.toLowerCase();
    const filtered = filterTabs(query).length;
    
    if (query) {
      tabCount.textContent = `${filtered}/${total} tabs`;
    } else {
      tabCount.textContent = `${total} tabs`;
    }
  }

  function displayTabs(tabs) {
    tabList.innerHTML = '';
    if (tabs.length === 0) {
      const li = document.createElement('li');
      li.className = 'tab-item';
      const content = document.createElement('div');
      content.className = 'tab-content';
      content.innerHTML = '<span class="tab-title">No tabs found</span>';
      li.appendChild(content);
      tabList.appendChild(li);
      return;
    }

    tabs.forEach((tab, index) => {
      const li = document.createElement('li');
      li.className = 'tab-item';
      if (index === selectedIndex) {
        li.classList.add('selected');
      }

      // Create tab content container
      const content = document.createElement('div');
      content.className = 'tab-content';

      // Add favicon if available
      if (tab.favIconUrl) {
        const img = document.createElement('img');
        img.src = tab.favIconUrl;
        img.className = 'tab-favicon';
        img.onerror = () => img.style.display = 'none';
        content.appendChild(img);
      }

      // Add tab title
      const title = document.createElement('span');
      title.className = 'tab-title';
      title.textContent = tab.title || tab.url || 'Untitled';
      content.appendChild(title);

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.className = 'close-button';
      closeButton.innerHTML = '×';
      closeButton.title = 'Close tab';
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });

      // Add click handlers
      li.addEventListener('click', () => switchToTab(tab));
      li.addEventListener('mouseover', () => {
        selectedIndex = index;
        updateSelectedTab();
      });

      li.appendChild(content);
      li.appendChild(closeButton);
      tabList.appendChild(li);
    });

    updateTabCount();
  }

  function closeTab(tabId) {
    chrome.tabs.remove(tabId, () => {
      if (chrome.runtime.lastError) {
        console.error('Error closing tab:', chrome.runtime.lastError);
        return;
      }
      
      // Update our local tabs list
      allTabs = allTabs.filter(t => t.id !== tabId);
      const query = searchInput.value.toLowerCase();
      const filteredTabs = filterTabs(query);
      
      // Update selected index
      if (selectedIndex >= filteredTabs.length) {
        selectedIndex = Math.max(0, filteredTabs.length - 1);
      }
      
      displayTabs(filteredTabs);
    });
  }

  function switchToTab(tab) {
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
    window.close();
  }

  function updateSelectedTab() {
    const items = tabList.getElementsByClassName('tab-item');
    Array.from(items).forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  function filterTabs(query) {
    return allTabs.filter(tab => {
      const title = (tab.title || '').toLowerCase();
      const url = (tab.url || '').toLowerCase();
      return title.includes(query) || url.includes(query);
    });
  }

  function handleKeyNavigation(e) {
    const filteredTabs = filterTabs(searchInput.value.toLowerCase());
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredTabs.length - 1);
        updateSelectedTab();
        ensureSelectedVisible();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelectedTab();
        ensureSelectedVisible();
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < filteredTabs.length) {
          switchToTab(filteredTabs[selectedIndex]);
        }
        break;
    }
  }

  function ensureSelectedVisible() {
    const selectedElement = tabList.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  // Initialize: fetch all tabs and set up event listeners
  chrome.tabs.query({}, function(tabs) {
    allTabs = tabs;
    if (allTabs.length > 0) {
      selectedIndex = 0;
    }
    displayTabs(allTabs);
  });

  // Listen for tab removals (from outside the extension)
  chrome.tabs.onRemoved.addListener((tabId) => {
    allTabs = allTabs.filter(t => t.id !== tabId);
    const query = searchInput.value.toLowerCase();
    const filteredTabs = filterTabs(query);
    
    if (selectedIndex >= filteredTabs.length) {
      selectedIndex = Math.max(0, filteredTabs.length - 1);
    }
    
    displayTabs(filteredTabs);
  });

  // Listen for new tabs
  chrome.tabs.onCreated.addListener((tab) => {
    allTabs.push(tab);
    const query = searchInput.value.toLowerCase();
    const filteredTabs = filterTabs(query);
    displayTabs(filteredTabs);
  });

  searchInput.addEventListener('input', function() {
    const filteredTabs = filterTabs(this.value.toLowerCase());
    selectedIndex = filteredTabs.length > 0 ? 0 : -1;
    displayTabs(filteredTabs);
  });

  document.addEventListener('keydown', handleKeyNavigation);
  searchInput.focus();
}); 