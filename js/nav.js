document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.ds-nav-links a, .nav-dropdown-menu a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const toggle = document.getElementById('navToggle');
  const linksContainer = document.getElementById('navLinks');
  if (toggle && linksContainer) {
    toggle.addEventListener('click', () => {
      linksContainer.classList.toggle('open');
    });
  }

  const dropdownBtn = document.getElementById('navDropdownBtn');
  const dropdownMenu = document.getElementById('navDropdownMenu');
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && e.target !== dropdownBtn) {
        dropdownMenu.classList.remove('open');
      }
    });
  }
});
