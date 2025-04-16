// public/script.js
let allExoplanets = [];
let filteredExoplanets = [];
let renderedCount = 0;
const batchSize = 20;

// Fungsi untuk merender batch exoplanet
function renderBatch(exoplanets, start, count) {
  const planetOutput = document.getElementById('planet-output');
  const batch = exoplanets.slice(start, start + count);
  const fragment = document.createDocumentFragment();

  batch.forEach(planet => {
    const card = document.createElement('div');
    card.className = 'planet-card';
    card.dataset.name = planet.name;
    card.innerHTML = `
      <h3>${planet.name}</h3>
      <p>Bintang: ${planet.host} • Ditemukan: ${planet.disc_year}</p>
      <p>Periode orbit: ${planet.period}</p>
      ${planet.mass !== 'Tidak diketahui' || planet.radius !== 'Tidak diketahui' ? `
        <p>
          ${planet.mass !== 'Tidak diketahui' ? `Massa: ${planet.mass}` : ''}
          ${planet.mass !== 'Tidak diketahui' && planet.radius !== 'Tidak diketahui' ? ' • ' : ''}
          ${planet.radius !== 'Tidak diketahui' ? `Radius: ${planet.radius}` : ''}
        </p>
      ` : ''}
    `;
    card.addEventListener('click', () => showPlanetDetail(planet.name));
    fragment.appendChild(card);
  });

  planetOutput.appendChild(fragment);
  console.log(`Rendered ${batch.length} exoplanets, total rendered: ${start + batch.length}`);
  return batch.length;
}

// Fungsi untuk memuat dan menampilkan exoplanet
function displayExoplanets(exoplanets) {
  const planetOutput = document.getElementById('planet-output');
  planetOutput.innerHTML = '';
  renderedCount = 0;
  filteredExoplanets = exoplanets;

  // Render batch pertama
  renderedCount += renderBatch(filteredExoplanets, renderedCount, batchSize);
  planetOutput.style.display = 'block';

  // Setup observer untuk lazy loading
  const sentinel = document.createElement('div');
  sentinel.id = 'sentinel';
  planetOutput.appendChild(sentinel);

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && renderedCount < filteredExoplanets.length) {
      console.log('Loading more exoplanets...');
      renderedCount += renderBatch(filteredExoplanets, renderedCount, batchSize);
    }
  }, { threshold: 0.1 });

  observer.observe(sentinel);
}

// Fungsi untuk memuat daftar exoplanet
async function loadExoplanets() {
  const planetOutput = document.getElementById('planet-output');
  const loading = document.getElementById('loading');
  const localData = document.getElementById('local-data');
  const errorMessage = document.getElementById('error-message');
  const searchInput = document.getElementById('search-input');

  loading.style.display = 'flex';
  planetOutput.style.display = 'none';
  localData.style.display = 'none';
  errorMessage.style.display = 'none';
  planetOutput.innerHTML = '';

  try {
    const response = await fetch('/get-exoplanets');
    const data = await response.json();

    loading.style.display = 'none';

    if (data.has_error) {
      errorMessage.innerHTML = `
        <p>Terjadi kesalahan: ${data.message}</p>
        <button onclick="loadLocalData()">Gunakan Data Lokal</button>
      `;
      errorMessage.style.display = 'block';
    } else {
      allExoplanets = data.exoplanets;
      console.log(`Loaded ${allExoplanets.length} exoplanets`);
      displayExoplanets(allExoplanets);

      if (data.is_local) {
        localData.style.display = 'inline-flex';
      }

      // Reset search input
      searchInput.value = '';
    }
  } catch (error) {
    console.error('Error:', error);
    loading.style.display = 'none';
    errorMessage.innerHTML = `
      <p>Terjadi kesalahan saat memuat data.</p>
      <button onclick="loadLocalData()">Gunakan Data Lokal</button>
    `;
    errorMessage.style.display = 'block';
  }
}

// Fungsi untuk memuat data lokal
async function loadLocalData() {
  const planetOutput = document.getElementById('planet-output');
  const loading = document.getElementById('loading');
  const localData = document.getElementById('local-data');
  const errorMessage = document.getElementById('error-message');
  const searchInput = document.getElementById('search-input');

  loading.style.display = 'flex';
  planetOutput.style.display = 'none';
  localData.style.display = 'none';
  errorMessage.style.display = 'none';
  planetOutput.innerHTML = '';

  try {
    const response = await fetch('/get-exoplanets');
    const data = await response.json();

    loading.style.display = 'none';

    if (data.has_error) {
      errorMessage.innerHTML = `<p>Terjadi kesalahan: ${data.message}</p>`;
      errorMessage.style.display = 'block';
    } else {
      allExoplanets = data.exoplanets;
      console.log(`Loaded ${allExoplanets.length} exoplanets from local data`);
      displayExoplanets(allExoplanets);
      localData.style.display = 'inline-flex';

      // Reset search input
      searchInput.value = '';
    }
  } catch (error) {
    console.error('Error:', error);
    loading.style.display = 'none';
    errorMessage.innerHTML = `<p>Terjadi kesalahan saat memuat data lokal.</p>`;
    errorMessage.style.display = 'block';
  }
}

// Fungsi untuk menampilkan detail exoplanet di modal
async function showPlanetDetail(planetName) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const loading = document.getElementById('loading');

  loading.style.display = 'flex';
  modalBody.innerHTML = '';
  modal.style.display = 'flex';

  try {
    // Ambil data exoplanet
    const planetResponse = await fetch(`/search-exoplanet/${encodeURIComponent(planetName)}`);
    const planetData = await planetResponse.json();

    // Ambil data Wikipedia
    const wikiResponse = await fetch(`/wiki/${encodeURIComponent(planetName)}`);
    const wikiData = await wikiResponse.json();

    loading.style.display = 'none';

    let wikiContent = '';
    if (!wikiData.has_error) {
      wikiContent = `
        <div class="modal-card">
          <h3>Informasi Wikipedia</h3>
          ${wikiData.wiki.thumbnail ? `<img src="${wikiData.wiki.thumbnail}" alt="${wikiData.wiki.title}">` : ''}
          <p><strong>${wikiData.wiki.title}</strong></p>
          <p>${wikiData.wiki.extract}</p>
          <p><a href="${wikiData.wiki.page_url}" target="_blank" class="wiki-link">Baca selengkapnya</a></p>
        </div>
      `;
    } else {
      wikiContent = `<div class="modal-card"><p>${wikiData.message}</p></div>`;
    }

    modalBody.innerHTML = `
      <div class="modal-card">
        <h3>Data Planet</h3>
        <p><strong>Nama Planet:</strong> ${planetData.exoplanet.name}</p>
        <p><strong>Bintang Induk:</strong> ${planetData.exoplanet.host}</p>
        <p><strong>Tahun Penemuan:</strong> ${planetData.exoplanet.disc_year}</p>
        <p><strong>Periode Orbit:</strong> ${planetData.exoplanet.period}</p>
        <p><strong>Massa:</strong> ${planetData.exoplanet.mass}</p>
        <p><strong>Radius:</strong> ${planetData.exoplanet.radius}</p>
      </div>
      ${wikiContent}
    `;
  } catch (error) {
    console.error('Error:', error);
    loading.style.display = 'none';
    modalBody.innerHTML = '<p>Terjadi kesalahan saat memuat detail.</p>';
  }
}

// Muat data saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  loadExoplanets();

  // Event listener untuk searchbar
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    filteredExoplanets = allExoplanets.filter(planet =>
      planet.name.toLowerCase().includes(query)
    );
    console.log(`Filtered ${filteredExoplanets.length} exoplanets`);
    displayExoplanets(filteredExoplanets);
  });
});

// Refresh data
document.getElementById('refresh-btn').addEventListener('click', loadExoplanets);

// Tutup modal
document.querySelector('.close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

// Tutup modal saat klik di luar
window.addEventListener('click', (e) => {
  const modal = document.getElementById('modal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
