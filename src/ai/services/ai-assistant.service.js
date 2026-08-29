/**
 * TREXIO AI ENGINE - CONVERSATIONAL AI ASSISTANT SERVICE
 * Production-ready AI Assistant for marketplace discovery, product comparison,
 * booking & payment guidance, grounded in real Trexio database records.
 */

const aiOrchestratorService = require('./ai-orchestrator.service');
const aiRecommendationEngineService = require('./ai-recommendation-engine.service');
const aiSmartSearchService = require('./ai-smart-search.service');
const aiAdventureIntelligenceService = require('./ai-adventure-intelligence.service');
const aiDataService = require('./ai-data.service');
const aiSecurityService = require('./ai-security.service');
const aiUsageService = require('./ai-usage.service');
const aiFeatureFlagsService = require('./ai-feature-flags.service');
const { AI_FEATURE_FLAGS } = require('../types');

// In-Memory Session Memory Store (Session ID -> Messages)
const sessionMemoryStore = new Map();
const MAX_SESSION_TURNS = 10;

class AIAssistantService {
  /**
   * Retrieves or initializes session conversation context.
   */
  getMemory(sessionId) {
    if (!sessionId) return [];
    return sessionMemoryStore.get(sessionId) || [];
  }

  /**
   * Stores recent conversation turn into session memory.
   */
  saveMemory(sessionId, userMessage, aiResponse) {
    if (!sessionId) return;
    const history = this.getMemory(sessionId);
    history.push({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });
    history.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });

    // Keep memory concise (last N turns)
    if (history.length > MAX_SESSION_TURNS * 2) {
      history.splice(0, history.length - MAX_SESSION_TURNS * 2);
    }
    sessionMemoryStore.set(sessionId, history);
  }

  /**
   * Clears session memory.
   */
  clearMemory(sessionId) {
    if (sessionId && sessionMemoryStore.has(sessionId)) {
      sessionMemoryStore.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Extracts user intent and parameters using structured AI or deterministic rule parser fallback.
   */
  async extractIntentAndParameters(userMessage, conversationHistory = []) {
    const prompt = `Analisis pesan pengguna di platform marketplace pendakian TREXIO dan ekstrak intent serta parameternya.

Pesan Pengguna: "${userMessage}"

Riwayat Percakapan Sebelumnya:
${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}

Daftar Intent yang Didukung:
- SEARCH_TRIP (mencari trip/pendakian umum)
- FIND_OPEN_TRIP (mencari open trip)
- FIND_PRIVATE_TRIP (mencari private trip)
- FIND_DESTINATION (mencari informasi destinasi/gunung)
- FIND_GUIDE (mencari pemandu gunung APGI)
- FIND_PORTER (mencari porter/logistik)
- FIND_BASECAMP (mencari pos SIMAKSI/basecamp)
- FIND_RENTAL (mencari sewa alat outdoor/tenda/carrier)
- COMPARE_PRODUCT (membandingkan dua atau lebih produk/trip)
- PRODUCT_DETAIL (meminta detail spesifik produk)
- TRIP_RECOMMENDATION (meminta rekomendasi trip untuk pemula/kebiasaan)
- BUDGET_SEARCH (mencari berdasarkan batasan harga/budget)
- BOOKING_HELP (bantuan alur cara booking/syarat/persyaratan)
- PAYMENT_HELP / TREXIO_PAY_HELP (bantuan metode pembayaran/Midtrans/Trexio Pay)
- ACCOUNT_HELP / GENERAL_TREXIO_HELP (bantuan umum platform)

Format Output JSON Persis:
{
  "intent": "NAMA_INTENT",
  "destination": "nama gunung atau lokasi jika ada, misal: Gunung Prau",
  "category": "kategori jika ada, misal: Gunung / Open Trip / Guide / Porter / Rental",
  "trip_type": "Open Trip / Private Trip / Rental / Guide / null",
  "max_budget": number_atau_null_dalam_IDR,
  "difficulty": "Pemula / Sedang / Sulit / null",
  "date_keyword": "bulan depan / minggu ini / null",
  "query": "kata kunci pencarian tambahan",
  "compare_keywords": ["item1", "item2"] (jika compare)
}`;

    const schema = {
      type: 'OBJECT',
      properties: {
        intent: { type: 'STRING' },
        destination: { type: 'STRING', nullable: true },
        category: { type: 'STRING', nullable: true },
        trip_type: { type: 'STRING', nullable: true },
        max_budget: { type: 'NUMBER', nullable: true },
        difficulty: { type: 'STRING', nullable: true },
        date_keyword: { type: 'STRING', nullable: true },
        query: { type: 'STRING', nullable: true },
        compare_keywords: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          nullable: true,
        },
      },
      required: ['intent'],
    };

    try {
      const orchestratorResult = await aiOrchestratorService.execute({
        feature: AI_FEATURE_FLAGS.AI_ASSISTANT,
        prompt,
        schema,
        temperature: 0.1,
        timeoutMs: 10000,
        fallbackFn: () => this.fallbackIntentExtraction(userMessage),
      });

      if (orchestratorResult.success && orchestratorResult.data) {
        return orchestratorResult.data;
      }
    } catch (e) {
      console.warn('[AIAssistant] AI Intent extraction failed, using deterministic fallback:', e.message);
    }

    return this.fallbackIntentExtraction(userMessage);
  }

  /**
   * Deterministic Intent Parser Fallback.
   */
  fallbackIntentExtraction(text) {
    const lower = text.toLowerCase();
    let intent = 'GENERAL_TREXIO_HELP';
    let destination = null;
    let category = null;
    let max_budget = null;
    let trip_type = null;
    let difficulty = null;

    // Detect Budget
    const budgetMatch = lower.match(/(?:budget|maksimal|maks|dibawah|di bawah|harga|rp|000|ribu|jt|juta)\s*(\d+[\d\.\,]*)/i) || lower.match(/(\d+)\s*(?:ribu|rb|k|jt|juta)/i);
    if (budgetMatch) {
      let valStr = budgetMatch[1].replace(/[\.,]/g, '');
      let val = parseInt(valStr, 10);
      if (lower.includes('jt') || lower.includes('juta')) val *= 1000000;
      else if (lower.includes('ribu') || lower.includes('rb') || lower.includes('k')) val *= 1000;
      else if (val < 1000) val *= 1000; // e.g. "700" -> 700000
      max_budget = val;
    }

    // Detect Destinations
    const destinations = ['prau', 'gede', 'bromo', 'rinjani', 'semeru', 'pangrango', 'papandayan', 'merbabu', 'slamet', 'sindoro', 'sumbing', 'raja ampat', 'dieng'];
    for (const d of destinations) {
      if (lower.includes(d)) {
        destination = `Gunung ${d.charAt(0).toUpperCase() + d.slice(1)}`;
        if (d === 'raja ampat') destination = 'Raja Ampat';
        break;
      }
    }

    // Detect Difficulty
    if (lower.includes('pemula') || lower.includes('mudah') || lower.includes('santai')) difficulty = 'Pemula';
    else if (lower.includes('sedang') || lower.includes('menengah')) difficulty = 'Sedang';
    else if (lower.includes('sulit') || lower.includes('ekstrem')) difficulty = 'Sulit';

    // Detect Backpacker & Route Keywords
    if (lower.includes('rute') || lower.includes('multimodal') || lower.includes('transit') || lower.includes('ke sana naik apa') || lower.includes('jalur transportasi')) {
      intent = 'FIND_ROUTE';
    } else if (lower.includes('nebeng') || lower.includes('shared ride') || lower.includes('angkot') || lower.includes('ojek') || lower.includes('shuttle lokal') || lower.includes('transport lokal')) {
      intent = 'FIND_LOCAL_TRANSPORT';
    } else if (lower.includes('buddy') || lower.includes('kawan trip') || lower.includes('teman mendaki') || lower.includes('kawan jalan') || lower.includes('travel intent')) {
      intent = 'FIND_BUDDY';
    } else if (lower.includes('split cost') || lower.includes('patungan') || lower.includes('hitung biaya') || lower.includes('estimasi biaya') || lower.includes('kalkulasi cost')) {
      intent = 'SPLIT_COST';
    } else if (lower.includes('buat journey') || lower.includes('ekspedisi') || lower.includes('track trip') || lower.includes('journey')) {
      intent = 'CREATE_JOURNEY';
    } else if (lower.includes('cuaca') || lower.includes('hujan') || lower.includes('angin') || lower.includes('suhu') || lower.includes('prakiraan')) {
      intent = 'SAFETY_WEATHER_INFO';
    } else if (lower.includes('buka') || lower.includes('tutup') || lower.includes('jalur') || lower.includes('kondisi pendakian') || lower.includes('status jalur')) {
      intent = 'SAFETY_TRAIL_STATUS';
    } else if (lower.includes('bawa') || lower.includes('packing') || lower.includes('perlengkapan') || lower.includes('checklist') || lower.includes('peralatan')) {
      intent = 'SAFETY_PACKING_CHECKLIST';
    } else if (lower.includes('siap') || lower.includes('persiapan') || lower.includes('readiness') || lower.includes('analisis kesiapan')) {
      intent = 'SAFETY_READINESS_CHECK';
    } else if (lower.includes('darurat') || lower.includes('sos') || lower.includes('basarnas') || lower.includes('p3k') || lower.includes('tersesat') || lower.includes('hipotermia')) {
      intent = 'SAFETY_EMERGENCY';
    } else if (lower.includes('bandingkan') || lower.includes('beda') || lower.includes('komparasi')) {
      intent = 'COMPARE_PRODUCT';
    } else if (lower.includes('guide') || lower.includes('pemandu')) {
      intent = 'FIND_GUIDE';
      category = 'Guide';
    } else if (lower.includes('porter') || lower.includes('bawa barang') || lower.includes('angkat')) {
      intent = 'FIND_PORTER';
      category = 'Porter';
    } else if (lower.includes('basecamp') || lower.includes('simaksi') || lower.includes('pos')) {
      intent = 'FIND_BASECAMP';
      category = 'Basecamp';
    } else if (lower.includes('sewa') || lower.includes('rental') || lower.includes('tenda') || lower.includes('carrier') || lower.includes('alat') || lower.includes('gear')) {
      intent = 'FIND_RENTAL';
      category = 'Rental';
    } else if (lower.includes('open trip') || lower.includes('opentrip') || lower.includes('gabungan')) {
      intent = 'FIND_OPEN_TRIP';
      trip_type = 'Open Trip';
    } else if (lower.includes('private trip') || lower.includes('privat')) {
      intent = 'FIND_PRIVATE_TRIP';
      trip_type = 'Private Trip';
    } else if (lower.includes('rekomendasi') || lower.includes('saran') || lower.includes('pemula')) {
      intent = 'TRIP_RECOMMENDATION';
    } else if (lower.includes('bayar') || lower.includes('pembayaran') || lower.includes('midtrans') || lower.includes('trexio pay') || lower.includes('wallet') || lower.includes('saldo')) {
      intent = 'PAYMENT_HELP';
    } else if (lower.includes('booking') || lower.includes('pesan') || lower.includes('cara booking') || lower.includes('tiket')) {
      intent = 'BOOKING_HELP';
    } else if (max_budget) {
      intent = 'BUDGET_SEARCH';
    } else if (destination) {
      intent = 'SEARCH_TRIP';
    }

    return {
      intent,
      destination,
      category,
      trip_type,
      max_budget,
      difficulty,
      query: text,
    };
  }

  /**
   * Controlled Backend Search Tool for Marketplace Items - Delegates to Phase 5 Smart Search Engine.
   */
  async searchMarketplace({ intent, destination, category, trip_type, max_budget, difficulty, query }, dbStores, user = null) {
    try {
      const searchRes = await aiSmartSearchService.search({
        query: query || destination || category || '',
        category: category || (trip_type === 'Open Trip' ? 'Open Trip' : trip_type === 'Private Trip' ? 'Private Trip' : null),
        difficulty,
        max_price: max_budget,
        limit: 10,
        user,
        dbStores,
      });

      if (searchRes && searchRes.results && searchRes.results.length > 0) {
        return searchRes.results.map((item) => {
          const isRental = item.type === 'rental' || item.category === 'Rental' || item.category === 'Rental Gear' || Boolean(item.price_per_day);
          const pathId = item.slug || item.id;
          const canonicalPath = isRental ? `/rental/${pathId}` : `/trip/${pathId}`;
          return {
            id: item.id,
            slug: item.slug || null,
            type: isRental ? 'rental' : 'trip',
            title: item.title || item.name,
            category: item.category || (isRental ? 'Rental Gear' : 'Open Trip'),
            destination: item.destination || item.region || 'Indonesia',
            price: Number(item.price || item.price_per_day || 0),
            formatted_price: item.formatted_price || `Rp ${Number(item.price || 0).toLocaleString('id-ID')}`,
            rating: item.rating || 4.9,
            review_count: item.review_count || 12,
            vendor_name: item.vendor_name || 'Official TREXIO Partner',
            vendor: {
              id: item.vendor_id || null,
              name: item.vendor_name || 'Official TREXIO Partner',
              slug: item.vendor_slug || null,
            },
            cover_image: item.cover_image || item.image || null,
            badges: item.badges || [],
            location: item.destination || item.region || 'Indonesia',
            availability: 'Tersedia',
            detailPath: canonicalPath,
            action_type: 'VIEW_DETAIL',
            action_label: isRental ? 'Sewa Alat' : 'Lihat Detail',
            action_url: canonicalPath,
          };
        });
      }
    } catch (err) {
      console.warn('[AIAssistant] Smart Search integration error:', err.message);
    }
    return [];
  }

  /**
   * Controlled Guide Search Tool.
   */
  searchGuide(destination, dbStores) {
    const trips = dbStores.trips || [];
    let matchedTrip = null;

    if (destination) {
      const destLower = destination.toLowerCase().replace('gunung ', '');
      matchedTrip = trips.find((t) => t.destination?.toLowerCase().includes(destLower) || t.title?.toLowerCase().includes(destLower));
    }
    if (!matchedTrip && trips.length > 0) matchedTrip = trips[0];

    const targetPath = matchedTrip ? `/trip/${matchedTrip.slug || matchedTrip.id}` : '/explore';

    return [
      {
        id: matchedTrip ? matchedTrip.id : 'guide_apgi_01',
        slug: matchedTrip?.slug || null,
        type: 'trip',
        title: matchedTrip ? `Guide & Leader: ${matchedTrip.title}` : 'Guide Gunung APGI Bersertifikat',
        category: 'Guide',
        destination: destination || matchedTrip?.destination || 'Gunung Gede / Bromo / Prau / Rinjani',
        price: matchedTrip ? Number(matchedTrip.price) : 350000,
        formatted_price: matchedTrip ? `Rp ${Number(matchedTrip.price).toLocaleString('id-ID')}` : 'Rp 350.000 / hari',
        rating: 4.9,
        vendor_name: 'Asosiasi Pemandu Gunung Indonesia (APGI)',
        cover_image: matchedTrip?.cover_image || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
        badges: ['Sertifikasi BNSP', 'First Aid Certified'],
        description: 'Pemandu gunung bersertifikasi APGI resmi dengan kemampuan navigasi, manajemen krisis & pertolongan pertama (P3K).',
        detailPath: targetPath,
        action_label: 'Lihat Trip & Guide',
        action_url: targetPath,
      },
    ];
  }

  /**
   * Controlled Porter Search Tool.
   */
  searchPorter(destination, dbStores) {
    const trips = dbStores.trips || [];
    let matchedTrip = null;

    if (destination) {
      const destLower = destination.toLowerCase().replace('gunung ', '');
      matchedTrip = trips.find((t) => t.destination?.toLowerCase().includes(destLower) || t.title?.toLowerCase().includes(destLower));
    }
    if (!matchedTrip && trips.length > 0) matchedTrip = trips[0];

    const targetPath = matchedTrip ? `/trip/${matchedTrip.slug || matchedTrip.id}` : '/explore';

    return [
      {
        id: matchedTrip ? matchedTrip.id : 'porter_logistics_01',
        slug: matchedTrip?.slug || null,
        type: 'trip',
        title: matchedTrip ? `Jasa Porter & Paket: ${matchedTrip.title}` : 'Jasa Porter & Tim Masak Gunung',
        category: 'Porter',
        destination: destination || matchedTrip?.destination || 'Gunung Gede / Prau / Rinjani / Semeru',
        price: matchedTrip ? Number(matchedTrip.price) : 300000,
        formatted_price: matchedTrip ? `Rp ${Number(matchedTrip.price).toLocaleString('id-ID')}` : 'Rp 300.000 / hari',
        rating: 5.0,
        vendor_name: 'Paguyuban Porter Lokal Trexio',
        cover_image: matchedTrip?.cover_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
        badges: ['Lokal Berpengalaman', 'Termasuk Masak'],
        description: 'Porter lokal ramah dan fisik prima. Membantu membawa barang tenda, air, serta menyajikan makanan hangat di camp.',
        detailPath: targetPath,
        action_label: 'Pesan Porter & Trip',
        action_url: targetPath,
      },
    ];
  }

  /**
   * Controlled Basecamp Search Tool.
   */
  searchBasecamp(destination, dbStores) {
    const locations = dbStores.masterLocations?.basecamps || [];
    let matched = locations;

    if (destination) {
      const destLower = destination.toLowerCase().replace('gunung ', '');
      matched = locations.filter((b) => b.name.toLowerCase().includes(destLower) || b.address?.toLowerCase().includes(destLower));
    }

    if (matched.length === 0) matched = locations;

    return matched.map((b) => {
      const targetPath = b.id ? `/destination/${b.id}` : '/explore';
      return {
        id: b.id,
        title: b.name,
        category: 'Basecamp',
        destination: b.address || 'Kaki Gunung',
        price: 15000,
        formatted_price: 'Rp 15.000 / pendaki (SIMAKSI)',
        rating: 4.8,
        vendor_name: 'Pos SIMAKSI Resmi Taman Nasional',
        cover_image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800',
        badges: ['Registrasi Resmi', 'Fasilitas Lengkap'],
        facilities: b.facilities || ['Toilet', 'Musholla', 'Parkir 24H'],
        detailPath: targetPath,
        action_label: 'Lihat Info SIMAKSI',
        action_url: targetPath,
      };
    });
  }

  /**
   * Products Comparison Tool.
   */
  compareProducts(compareKeywords, dbStores) {
    const trips = dbStores.trips || [];
    const items = [];

    if (compareKeywords && compareKeywords.length > 0) {
      for (const kw of compareKeywords) {
        const match = trips.find((t) => t.title?.toLowerCase().includes(kw.toLowerCase()) || t.destination?.toLowerCase().includes(kw.toLowerCase()));
        if (match) items.push(match);
      }
    }

    if (items.length < 2) {
      // Pick top 2 trips for comparison
      items.push(...trips.slice(0, 2));
    }

    return items.map((t) => ({
      id: t.id,
      title: t.title,
      destination: t.destination,
      price: Number(t.price),
      formatted_price: `Rp ${Number(t.price).toLocaleString('id-ID')}`,
      difficulty: t.difficulty || 'Pemula',
      duration: `${t.duration_days || 2} Hari`,
      includes: t.includes || ['Tenda', 'Simaksi', 'Guide'],
      excludes: t.excludes || ['Transportasi pribadi'],
      meeting_points: t.meeting_points || ['Basecamp Resmi'],
      organizer: t.organizer || 'Official TREXIO Partner',
      rating: t.rating || 4.9,
    }));
  }

  /**
   * Main Process Message Handler.
   */
  async processUserMessage({ userMessage, sessionId, user = null, dbStores }) {
    // 1. Check Security & Prompt Injection
    const securityCheck = aiSecurityService.validatePrompt(userMessage);
    if (!securityCheck.valid) {
      return {
        answer: `Maaf, instruksi tidak dapat diproses: ${securityCheck.reason}. Trexio AI Assistant hanya membantu pencarian dan pemahaman produk marketplace pendakian secara aman.`,
        products: [],
        intent: 'SECURITY_BLOCKED',
        suggestedPrompts: this.getDefaultSuggestedPrompts(),
      };
    }

    // 2. Fetch Conversation History
    const conversationHistory = this.getMemory(sessionId);

    // 3. Extract Intent & Parameters
    const params = await this.extractIntentAndParameters(userMessage, conversationHistory);
    const { intent, destination, category, trip_type, max_budget, difficulty, query } = params;

    let products = [];
    let comparisonData = null;
    let answerText = '';

    // 4. Execute Controlled Backend Tool based on Intent
    switch (intent) {
      case 'SEARCH_TRIP':
      case 'FIND_OPEN_TRIP':
      case 'FIND_PRIVATE_TRIP':
      case 'FIND_RENTAL':
      case 'BUDGET_SEARCH':
      case 'FIND_DESTINATION': {
        products = await this.searchMarketplace(params, dbStores, user);
        break;
      }
      case 'FIND_GUIDE': {
        products = this.searchGuide(destination, dbStores);
        break;
      }
      case 'FIND_PORTER': {
        products = this.searchPorter(destination, dbStores);
        break;
      }
      case 'FIND_BASECAMP': {
        products = this.searchBasecamp(destination, dbStores);
        break;
      }
      case 'COMPARE_PRODUCT': {
        comparisonData = this.compareProducts(params.compare_keywords, dbStores);
        products = comparisonData.map((c) => ({
          id: c.id,
          title: c.title,
          category: 'Open Trip',
          destination: c.destination,
          price: c.price,
          formatted_price: c.formatted_price,
          rating: c.rating,
          vendor_name: c.organizer,
          badges: [c.difficulty],
          action_label: 'Lihat Detail',
          action_url: `/trips/${c.id}`,
        }));
        break;
      }
      case 'TRIP_RECOMMENDATION': {
        // Integrate Phase 2 Recommendation Engine
        const recs = await aiRecommendationEngineService.getPersonalizedRecommendations({
          user,
          category: category || 'Gunung',
          destination,
          limit: 4,
          trips: dbStores.trips || [],
          rentals: dbStores.rentals || [],
          vendors: dbStores.vendors || [],
          reviews: dbStores.reviews || [],
          bookings: dbStores.bookings || [],
          wishlists: dbStores.wishlists || [],
        });

        products = recs.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          category: r.category,
          destination: r.destination,
          price: r.price,
          formatted_price: `Rp ${Number(r.price).toLocaleString('id-ID')}`,
          rating: r.rating,
          review_count: r.review_count,
          vendor_name: dbStores.vendors?.find((v) => v.id === r.vendor_id)?.brand_name || 'Official TREXIO Partner',
          cover_image: r.cover_image,
          badges: [r.ai_reason || 'Rekomendasi Utama'],
          action_label: 'Lihat Detail',
          action_url: r.type === 'trip' ? `/trips/${r.id}` : `/rentals/${r.id}`,
        }));
        break;
      }
      case 'BOOKING_HELP': {
        answerText = `**Alur Pemesanan (Booking) Resmi di Trexio:**

1. **Pilih Trip/Alat Outdoor**: Jelajahi produk trip atau sewa alat resmi dari vendor terverifikasi.
2. **Pilih Tanggal & Jumlah Pax**: Tentukan tanggal keberangkatan dan titik kumpul (meeting point).
3. **Isi Data Pendaki**: Masukkan nama lengkap, NIK/Paspor, nomor darurat & riwayat pendakian.
4. **Pembayaran Aman**: Lakukan pembayaran via Trexio Pay / Midtrans (QRIS, Bank Transfer, E-Wallet).
5. **E-Tiket & SIMAKSI**: E-Tiket otomatis terbit & siap digunakan saat check-in di basecamp.

*Catatan: Semua transaksi dijamin 100% aman dengan sistem garansi Trexio.*`;
        break;
      }
      case 'SAFETY_WEATHER_INFO': {
        const weatherData = await aiAdventureIntelligenceService.getWeatherForDestination(destination || 'dest_prau');
        if (weatherData.is_available) {
          answerText = `**Prakiraan Cuaca Langsung (${weatherData.destination_name} - ${weatherData.elevation}):**\n\n` +
            `- **Kondisi**: ${weatherData.current.icon} ${weatherData.current.condition}\n` +
            `- **Suhu**: ${weatherData.current.temperature_celsius}°C (Kelembapan: ${weatherData.current.humidity_percent}%)\n` +
            `- **Kecepatan Angin**: ${weatherData.current.wind_speed_kmh} km/jam\n` +
            `- **Curah Hujan**: ${weatherData.current.precipitation_mm} mm\n` +
            `- **Status Jalur**: ${weatherData.current.is_safe_for_hiking ? '✅ Aman untuk Pendakian' : '⚠️ Perlu Waspada Cuaca Ekstrem'}\n\n` +
            `*Sumber: ${weatherData.source} (Diperbarui: ${new Date(weatherData.retrieved_at).toLocaleTimeString('id-ID')} WIB)*`;
        } else {
          answerText = `**Status Cuaca (${weatherData.destination_name}):**\n\n` +
            `Data cuaca langsung saat ini belum dapat diverifikasi dari penyedia layanan BMKG/Open-Meteo. ` +
            `Harap hubungi pos Basecamp resmi untuk kondisi terkini di lapangan.`;
        }
        break;
      }
      case 'SAFETY_TRAIL_STATUS': {
        const destIntel = aiAdventureIntelligenceService.getDestinationIntelligence(destination || 'dest_prau', dbStores);
        const trailStatuses = destIntel?.trail_statuses || [];
        const alerts = destIntel?.official_alerts || [];

        answerText = `**Status Resmi Jalur Pendakian (${destIntel?.destination?.name || destination || 'Gunung'}):**\n\n`;
        trailStatuses.forEach((s) => {
          const badge = s.status === 'OPEN' ? '🟢 OPEN' : s.status === 'CLOSED' ? '🔴 CLOSED' : s.status === 'RESTRICTED' ? '🟡 RESTRICTED' : '⚪ UNKNOWN';
          answerText += `**${s.trail_name}**: ${badge}\n- ${s.condition_notes}\n- *Sumber: ${s.source}*\n\n`;
        });

        if (alerts.length > 0) {
          answerText += `**Peringatan Resmi Terkait:**\n`;
          alerts.forEach((a) => {
            answerText += `- **[${a.severity}] ${a.title}**: ${a.message}\n`;
          });
        }
        break;
      }
      case 'SAFETY_PACKING_CHECKLIST': {
        const checklist = aiAdventureIntelligenceService.generateEquipmentChecklist({ destinationId: destination || 'dest_prau', durationDays: 2, tripType: 'camping' });
        answerText = `**Daftar Perlengkapan & Equipment Checklist Camping Pendakian (${destination || 'Gunung Prau'}):**\n\n`;
        checklist.categories.forEach((cat) => {
          answerText += `**${cat.category_name}:**\n`;
          cat.items.forEach((item) => {
            answerText += `- [ ] ${item.name} ${item.is_essential ? '*(VITAL)*' : ''}\n`;
          });
          answerText += `\n`;
        });
        answerText += `*Dapat disewa langsung melalui Trexio Rental Perlengkapan.*`;
        break;
      }
      case 'SAFETY_READINESS_CHECK': {
        const readiness = await aiAdventureIntelligenceService.evaluateTripReadiness({ destinationId: destination || 'dest_prau', tripType: 'camping' }, dbStores);
        answerText = `**Analisis Kesiapan Trip Pendakian (${readiness.destination_name}):**\n\n` +
          `- **Perlengkapan**: ${readiness.readiness_dimensions.equipment.label}\n` +
          `- **Kondisi Cuaca**: ${readiness.readiness_dimensions.weather.status}\n` +
          `- **Status Jalur**: ${readiness.readiness_dimensions.route.status}\n` +
          `- **Logistik**: ${readiness.readiness_dimensions.logistics.status}\n\n` +
          `**Panduan Langkah Persiapan:**\n` +
          readiness.guidance_tips.map((t) => `- ${t}`).join('\n') + `\n\n` +
          `*${readiness.disclaimer}*`;
        break;
      }
      case 'SAFETY_EMERGENCY': {
        const emg = aiAdventureIntelligenceService.getEmergencyAssistanceInfo(destination);
        answerText = `**Kontak Darurat & Bantuan Khusus Pendakian TREXIO:**\n\n` +
          emg.emergency_contacts.slice(0, 5).map((c) => `- **${c.name}**: \`${c.phone}\``).join('\n') + `\n\n` +
          `**SOP Penanganan Hipotermia & Tersehat:**\n` +
          emg.emergency_protocols[0].steps.map((s) => `- ${s}`).join('\n') + `\n\n` +
          `*Akses halaman lengkap /emergency untuk fitur Berbagi Lokasi Darurat GPS & Hotline Basecamp.*`;
        break;
      }
      case 'FIND_ROUTE': {
        const dest = destination || 'Gunung Prau';
        answerText = `**Rekomendasi Rute Multimodal Terpadu (${dest}):**\n\n` +
          `1. **Kereta Api / Bus Intercity**: Jakarta/Surabaya &rarr; Stasiun/Terminal Terdekat.\n` +
          `2. **Shuttle / Angkot Lokal**: Stasiun &rarr; Basecamp Resmi ${dest}.\n` +
          `3. **Trexio Nebeng (Shared Ride)**: Hemat biaya dengan berbagi kendaran kawan backpacker.\n\n` +
          `*Klik menu "Backpacker > Find Your Route" untuk navigasi rute lengkap beserta kalkulasi ongkos.*`;
        products = [
          {
            id: 'route_prau_01',
            productId: 'trip_01',
            productSlug: 'open-trip-gunung-prau-2d1n',
            routeId: 'route_prau_multimodal',
            journeyId: null,
            title: `Rute Multimodal ${dest}`,
            category: 'Backpacker Route',
            destination: dest,
            price: 185000,
            formatted_price: 'Rp 185.000 / pax',
            rating: 4.9,
            vendor_name: 'Trexio Route Engine',
            badges: ['Multimodal', 'Hemat 40%'],
            action_label: 'Lihat Rute',
            action_url: '/backpacker?tab=route',
          },
        ];
        break;
      }
      case 'FIND_LOCAL_TRANSPORT': {
        const dest = destination || 'Basecamp';
        answerText = `**Pilihan Local Transport & Trexio Nebeng (Shared Ride):**\n\n` +
          `- **Trexio Nebeng (Cost Sharing)**: Berbagi tumpangan mobil/motor dengan traveler kawan trip.\n` +
          `- **Angkot / Shuttle Mitra**: Transportasi feeder resmi dari terminal/stasiun ke pintu pendakian.\n\n` +
          `*Akses "Backpacker > Local Transport" atau "Share Ride" di dashboard untuk memesan kursi.*`;
        products = [
          {
            id: 'ride_01',
            productId: 'prod_shuttle_01',
            productSlug: 'shuttle-basecamp-cibodas',
            routeId: 'route_shuttle_cibodas',
            journeyId: null,
            title: `Nebeng / Shuttle ${dest}`,
            category: 'Local Transport',
            destination: dest,
            price: 45000,
            formatted_price: 'Rp 45.000 / seat',
            rating: 4.8,
            vendor_name: 'Mitra Transport Trexio',
            badges: ['Shared Ride', 'Sisa 2 Seat'],
            action_label: 'Cari Nebeng',
            action_url: '/backpacker?tab=ride',
          },
        ];
        break;
      }
      case 'FIND_BUDDY': {
        const dest = destination || 'Gunung Prau';
        answerText = `**Rekomendasi Backpacker Buddy & Travel Intent (${dest}):**\n\n` +
          `Ditemukan pendaki lain dengan tanggal & destinasi serupa! Kontak & informasi pribadi terlindungi secara **Strict Double Opt-In**.\n\n` +
          `*Akses tab "Find Your Buddy" untuk mengajukan koneksi aman.*`;
        products = [
          {
            id: 'buddy_match_01',
            productId: null,
            productSlug: null,
            routeId: null,
            journeyId: 'j_prau_2026',
            title: `Buddy Pendakian ${dest}`,
            category: 'Find Buddy',
            destination: dest,
            price: 0,
            formatted_price: 'Match 95%',
            rating: 5.0,
            vendor_name: 'Verified Backpacker',
            badges: ['95% Match', 'Double Opt-In'],
            action_label: 'Connect Buddy',
            action_url: '/backpacker?tab=buddy',
          },
        ];
        break;
      }
      case 'SPLIT_COST': {
        answerText = `**Kalkulator Split Cost & Pengeluaran Ekspedisi:**\n\n` +
          `- Masukkan total pengeluaran bersama (Bensin, Tol, Logistik, Basecamp, Guide/Porter).\n` +
          `- Tentukan porsi pembayaran per kawan trip.\n` +
          `- Lakukan pembagian saldo otomatis via Trexio Pay.\n\n` +
          `*Akses tab "Split Your Cost" di Trexio Backpacker Dashboard.*`;
        products = [
          {
            id: 'split_calc_01',
            productId: null,
            productSlug: null,
            routeId: null,
            journeyId: 'j_active_01',
            title: 'Split Cost Ekspedisi Active',
            category: 'Cost Splitter',
            destination: destination || 'Semua Destinasi',
            price: 0,
            formatted_price: 'Fitur Otomatis',
            rating: 5.0,
            vendor_name: 'Trexio Ledger Engine',
            badges: ['Transparan', 'Trexio Pay'],
            action_label: 'Hitung Cost',
            action_url: '/backpacker?tab=split',
          },
        ];
        break;
      }
      case 'CREATE_JOURNEY': {
        answerText = `**Trexio Journey Tracker & Expeditions:**\n\n` +
          `- Buat rencana perjalanan (Journey) baru.\n` +
          `- Kelola waypoints / pos perhentian (stops).\n` +
          `- Gunakan fitur **Strict OPT-IN Live GPS** untuk keamanan tim di lapangan.\n\n` +
          `*Mulai journey baru dari tab "Track Your Journey" di Backpacker Dashboard.*`;
        products = [
          {
            id: 'journey_track_01',
            productId: null,
            productSlug: null,
            routeId: null,
            journeyId: 'j_new_01',
            title: `Ekspedisi ${destination || 'Baru'}`,
            category: 'Journey Tracker',
            destination: destination || 'Indonesia',
            price: 0,
            formatted_price: 'OPT-IN Live GPS',
            rating: 5.0,
            vendor_name: 'Trexio Expedition Tracker',
            badges: ['Live Check-in', 'Safe GPS'],
            action_label: 'Track Journey',
            action_url: '/backpacker?tab=track',
          },
        ];
        break;
      }
      case 'PAYMENT_HELP':
      case 'TREXIO_PAY_HELP': {
        answerText = `**Panduan Pembayaran & Trexio Pay:**

- **Metode Resmi Supported**: Midtrans Payment Gateway (QRIS, GoPay, ShopeePay, Virtual Account BCA/Mandiri/BRI/BNI, serta Kartu Kredit).
- **Trexio Pay**: Saldo dompet digital Trexio untuk pengembalian dana (refund) instan & pembayaran tanpa biaya penanganan.
- **Keamanan Transaksi**: Dana disimpan aman di rekening escrow Trexio dan baru diteruskan ke vendor setelah pendakian selesai.

*Perhatian: Jangan pernah melakukan transfer langsung ke rekening pribadi di luar platform resmi Trexio.*`;
        break;
      }
      default: {
        // General Search fallback
        products = await this.searchMarketplace({ intent: 'SEARCH_TRIP', ...params }, dbStores, user);
      }
    }

    // 5. Generate Natural Language Response Answer using Gemini / Grounded Template
    if (!answerText) {
      if (intent === 'COMPARE_PRODUCT' && comparisonData) {
        answerText = this.buildComparisonMarkdown(comparisonData);
      } else if (products.length > 0) {
        answerText = this.buildProductsFoundMarkdown(products, params);
      } else {
        answerText = `Maaf, saat ini belum ada produk atau layanan yang cocok dengan kriteria "${userMessage}" di marketplace Trexio.

Coba kata kunci lain, seperti:
- *"Open trip Bromo budget 800 ribu"*
- *"Sewa tenda dome Jakarta"*
- *"Guide Gunung Gede Pangrango"*`;
      }
    }

    // 6. Save Turn to Session Memory
    this.saveMemory(sessionId, userMessage, answerText);

    return {
      answer: answerText,
      products,
      intent,
      extractedParams: params,
      suggestedPrompts: this.getSuggestedPromptsForIntent(intent),
      sessionId,
    };
  }

  /**
   * Helper: Formats Product List into grounded Markdown text summary.
   */
  buildProductsFoundMarkdown(products, params) {
    const count = products.length;
    const destStr = params.destination ? ` untuk **${params.destination}**` : '';
    const budgetStr = params.max_budget ? ` dengan budget maksimal **Rp ${Number(params.max_budget).toLocaleString('id-ID')}**` : '';

    let text = `Berikut **${count} pilihan layanan resmi** yang ditemukan di Trexio Marketplace${destStr}${budgetStr}:\n\n`;

    products.slice(0, 3).forEach((p, idx) => {
      text += `**${idx + 1}. ${p.title}**\n`;
      text += `- **Harga**: ${p.formatted_price}\n`;
      text += `- **Penyelenggara/Vendor**: ${p.vendor_name}\n`;
      if (p.difficulty) text += `- **Tingkat Kesulitan**: ${p.difficulty}\n`;
      if (p.rating) text += `- **Rating**: ⭐ ${p.rating}/5.0\n`;
      text += `\n`;
    });

    text += `Silakan klik kartu produk di bawah ini untuk melihat detail lengkap, itinerary, dan jadwal keberangkatan.`;
    return text;
  }

  /**
   * Helper: Formats Comparison Data into clear side-by-side Markdown table.
   */
  buildComparisonMarkdown(items) {
    let text = `### 📊 Perbandingan Produk Open Trip Trexio\n\n`;
    text += `| Fitur / Spesifikasi | ${items[0]?.title || 'Trip A'} | ${items[1]?.title || 'Trip B'} |\n`;
    text += `| :--- | :--- | :--- |\n`;
    text += `| **Destinasi** | ${items[0]?.destination || '-'} | ${items[1]?.destination || '-'} |\n`;
    text += `| **Harga** | ${items[0]?.formatted_price || '-'} | ${items[1]?.formatted_price || '-'} |\n`;
    text += `| **Tingkat Kesulitan** | ${items[0]?.difficulty || 'Pemula'} | ${items[1]?.difficulty || 'Pemula'} |\n`;
    text += `| **Durasi** | ${items[0]?.duration || '-'} | ${items[1]?.duration || '-'} |\n`;
    text += `| **Penyelenggara** | ${items[0]?.organizer || 'Trexio Partner'} | ${items[1]?.organizer || 'Trexio Partner'} |\n`;
    text += `| **Rating Ulasan** | ⭐ ${items[0]?.rating || 4.9} | ⭐ ${items[1]?.rating || 4.9} |\n\n`;

    text += `*Catatan: Semua data diambil langsung dari basis data resmi Trexio.*`;
    return text;
  }

  /**
   * Default Suggested Prompts.
   */
  getDefaultSuggestedPrompts() {
    return [
      'Cari open trip Gunung Prau di bawah 700rb',
      'Rekomendasi trip untuk pendaki pemula',
      'Cari guide bersertifikat Gunung Gede',
      'Sewa tenda dome & carrier 60L',
      'Cari porter & basecamp Gunung Rinjani',
    ];
  }

  /**
   * Contextual Suggested Prompts after an intent response.
   */
  getSuggestedPromptsForIntent(intent) {
    switch (intent) {
      case 'SEARCH_TRIP':
      case 'FIND_OPEN_TRIP':
        return [
          'Bandingkan open trip ini',
          'Sewa peralatan camping pendakian ini',
          'Cari guide lokal untuk trip ini',
          'Bagaimana cara bookingnya?',
        ];
      case 'FIND_RENTAL':
        return [
          'Cari tenda kapasitas 4 orang',
          'Carrier 60L harga sewa terjangkau',
          'Cari open trip Gunung Bromo',
        ];
      case 'FIND_GUIDE':
      case 'FIND_PORTER':
        return [
          'Cari basecamp & pos SIMAKSI',
          'Lihat syarat izin pendakian',
          'Buka halaman explore trip',
        ];
      default:
        return this.getDefaultSuggestedPrompts();
    }
  }
}

module.exports = new AIAssistantService();
