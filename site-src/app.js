const searchInput = document.querySelector('[data-icon-search]');
const categorySelect = document.querySelector('[data-category-filter]');
const items = [...document.querySelectorAll('[data-icon-item]')];
const resultCount = document.querySelector('[data-result-count]');
const emptyState = document.querySelector('[data-empty-state]');

function filterIcons() {
  if (!items.length) return;
  const query = (searchInput?.value || '').trim().toLowerCase();
  const category = categorySelect?.value || 'all';
  let visible = 0;

  for (const item of items) {
    const matchesQuery = !query || item.dataset.search.includes(query);
    const matchesCategory = category === 'all' || item.dataset.category === category;
    item.hidden = !(matchesQuery && matchesCategory);
    if (!item.hidden) visible += 1;
  }

  if (resultCount) resultCount.textContent = `${visible} icon${visible === 1 ? '' : 's'}`;
  if (emptyState) emptyState.hidden = visible !== 0;
}

searchInput?.addEventListener('input', filterIcons);
categorySelect?.addEventListener('change', filterIcons);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}
