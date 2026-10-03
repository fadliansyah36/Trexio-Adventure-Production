/**
 * TREXIO AI ENGINE - PHASE 11: TRUST, FRAUD & RISK INTELLIGENCE SERVICE
 * Centralized risk assessment engine for detecting account anomalies, vendor risk,
 * tenant risk, booking fraud, payment/Trexio Pay anomalies, review manipulation,
 * community spam, ranking/search manipulation, advertising abuse, and AI abuse.
 *
 * Grounded strictly in real Trexio database records and security events.
 * Adheres to Human-in-the-Loop principles: Risk scores are signals, not final convictions.
 */

const { AI_FEATURE_FLAGS } = require('../types');
const GeminiProvider = require('../providers/gemini-provider');
const aiUsageService = require('./ai-usage.service');
const aiEventService = require('./ai-event.service');
const aiSecurityService = require('./ai-security.service');
const aiFeatureFlagsService = require('./ai-feature-flags.service');

class AIRiskEngineService {
  constructor() {
    this.gemini = new GeminiProvider();
  }

  // -------------------------------------------------------------
  // 1. ACCOUNT RISK ANALYSIS
  // -------------------------------------------------------------
  getAccountRisk(dbStores = {}) {
    const users = dbStores.users || [];
    const events = aiEventService.getRecentEvents(500);

    const accountRisks = users.map((u) => {
      let riskScore = 0;
      const signals = [];

      // Check failed login attempts
      const userFailedLogins = events.filter(
        (e) => e.userId === u.id && e.eventType === 'login_failed'
      );
      if (userFailedLogins.length >= 3) {
        riskScore += 35;
        signals.push(`Percobaan login gagal berulang (${userFailedLogins.length}x)`);
      }

      // Check status suspended
      if (u.status === 'suspended') {
        riskScore += 50;
        signals.push('Status akun saat ini ditangguhkan (Suspended)');
      }

      // Check unverified email / missing telephone
      if (!u.phone && !u.email) {
        riskScore += 20;
        signals.push('Profil pengguna tidak memiliki kontak terverifikasi');
      }

      const riskLevel =
        riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';

      return {
        user_id: u.id,
        name: u.name || u.email || 'Pengguna',
        email: u.email,
        role: u.role || 'user',
        risk_score: Math.min(100, riskScore),
        risk_level: riskLevel,
        detected_signals: signals,
        failed_login_count: userFailedLogins.length,
      };
    });

    return {
      total_accounts_analyzed: users.length,
      high_risk_accounts: accountRisks.filter((a) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL'),
      account_risks: accountRisks.sort((a, b) => b.risk_score - a.risk_score),
    };
  }

  // -------------------------------------------------------------
  // 2. VENDOR RISK ANALYSIS
  // -------------------------------------------------------------
  getVendorRisk(dbStores = {}) {
    const vendors = dbStores.vendors || [];
    const bookings = dbStores.bookings || [];

    const vendorRisks = vendors.map((v) => {
      let riskScore = 0;
      const signals = [];

      // Verification status
      if (v.status !== 'verified') {
        riskScore += 25;
        signals.push('Vendor belum memiliki lencana terverifikasi (Unverified Badge)');
      }

      // Booking cancellation rate
      const vBookings = bookings.filter((b) => b.vendor_id === v.id);
      const cancelled = vBookings.filter((b) =>
        ['cancelled', 'DIBATALKAN', 'rejected', 'failed'].includes(b.payment_status || b.status)
      ).length;
      const cancelRate = vBookings.length ? (cancelled / vBookings.length) * 100 : 0;

      if (vBookings.length >= 3 && cancelRate > 20) {
        riskScore += 35;
        signals.push(`Tingkat pembatalan pesanan tinggi (${cancelRate.toFixed(1)}%)`);
      }

      // Rating anomaly
      if (v.rating && v.rating < 3.5) {
        riskScore += 25;
        signals.push(`Rating kepuasan pengguna rendah (${v.rating}/5.0)`);
      }

      // Missing legal documentation / logo
      if (!v.logo || !v.cover_image) {
        riskScore += 15;
        signals.push('Profil kelengkapan media vendor belum optimal');
      }

      const riskLevel =
        riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';

      return {
        vendor_id: v.id,
        brand_name: v.brand_name || v.name || 'Vendor',
        status: v.status || 'unverified',
        risk_score: Math.min(100, riskScore),
        risk_level: riskLevel,
        detected_signals: signals,
        cancellation_rate: Number(cancelRate.toFixed(1)),
        total_bookings: vBookings.length,
      };
    });

    return {
      total_vendors_analyzed: vendors.length,
      flagged_vendors: vendorRisks.filter((v) => v.risk_score >= 40),
      vendor_risks: vendorRisks.sort((a, b) => b.risk_score - a.risk_score),
    };
  }

  // -------------------------------------------------------------
  // 3. BOOKING & REFUND FRAUD ANALYSIS
  // -------------------------------------------------------------
  getBookingRisk(dbStores = {}) {
    const bookings = dbStores.bookings || [];

    const bookingRisks = bookings.map((b) => {
      let riskScore = 0;
      const signals = [];

      const status = (b.payment_status || b.status || '').toLowerCase();

      if (['failed', 'expired', 'rejected'].includes(status)) {
        riskScore += 30;
        signals.push(`Status pesanan ${status.toUpperCase()}`);
      }

      if (['cancelled', 'dibatalkan'].includes(status)) {
        riskScore += 25;
        signals.push('Pesanan mengalami pembatalan');
      }

      // Unusually large transaction amount check
      const amount = Number(b.total_price || b.amount || b.price) || 0;
      if (amount > 15000000) {
        riskScore += 20;
        signals.push(`Nilai transaksi tinggi (Rp ${amount.toLocaleString('id-ID')})`);
      }

      const riskLevel =
        riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';

      return {
        booking_id: b.id,
        order_id: b.order_id || b.midtrans_order_id || b.id,
        user_name: b.user_name || b.contact_name || 'Customer',
        vendor_id: b.vendor_id,
        total_price: amount,
        status: b.payment_status || b.status || 'pending',
        risk_score: Math.min(100, riskScore),
        risk_level: riskLevel,
        detected_signals: signals,
      };
    });

    return {
      total_bookings_analyzed: bookings.length,
      suspicious_bookings: bookingRisks.filter((b) => b.risk_score >= 30),
      booking_risks: bookingRisks.sort((a, b) => b.risk_score - a.risk_score),
    };
  }

  // -------------------------------------------------------------
  // 4. TREXIO PAY & PAYMENT RISK
  // -------------------------------------------------------------
  getPaymentRisk(dbStores = {}) {
    const billingTx = dbStores.billing_transactions || [];

    const txRisks = billingTx.map((tx) => {
      let riskScore = 0;
      const signals = [];

      const st = (tx.status || '').toLowerCase();
      if (['failed', 'expire', 'deny', 'cancel'].includes(st)) {
        riskScore += 40;
        signals.push(`Status transaksi pembayaran: ${st.toUpperCase()}`);
      }

      const amount = Number(tx.amount) || 0;
      if (amount > 20000000) {
        riskScore += 25;
        signals.push(`Volume transaksi nominal besar (Rp ${amount.toLocaleString('id-ID')})`);
      }

      const riskLevel =
        riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';

      return {
        tx_id: tx.id,
        order_id: tx.order_id || tx.reference_id || tx.id,
        type: tx.type,
        amount: amount,
        payment_method: tx.payment_method || tx.payment_channel || 'qris',
        status: tx.status,
        risk_score: Math.min(100, riskScore),
        risk_level: riskLevel,
        detected_signals: signals,
      };
    });

    return {
      total_transactions_analyzed: billingTx.length,
      suspicious_transactions: txRisks.filter((t) => t.risk_score >= 30),
      payment_risks: txRisks.sort((a, b) => b.risk_score - a.risk_score),
    };
  }

  // -------------------------------------------------------------
  // 5. REVIEW & COMMUNITY RISK
  // -------------------------------------------------------------
  getReviewRisk(dbStores = {}) {
    const trips = dbStores.trips || [];
    const rentals = dbStores.rentals || [];

    const reviewsSample = [];
    [...trips, ...rentals].forEach((p) => {
      if (Array.isArray(p.reviews)) {
        p.reviews.forEach((r) => {
          let riskScore = 0;
          const signals = [];

          // Repeated or extremely short review content
          if (r.comment && r.comment.length < 5) {
            riskScore += 30;
            signals.push('Komentar ulasan sangat pendek atau terindikasi spam');
          }

          if (r.rating === 5 && (!r.comment || r.comment.toLowerCase().includes('bagus'))) {
            riskScore += 15;
            signals.push('Sinyal ulasan generik tanpa rincian pengalaman');
          }

          reviewsSample.push({
            product_title: p.title,
            reviewer: r.user_name || r.author || 'Anonymous',
            rating: r.rating,
            comment: r.comment,
            risk_score: riskScore,
            detected_signals: signals,
          });
        });
      }
    });

    return {
      total_reviews_analyzed: reviewsSample.length,
      flagged_reviews: reviewsSample.filter((r) => r.risk_score >= 20),
    };
  }

  getCommunityRisk(dbStores = {}) {
    const communities = dbStores.communities || [];

    const flaggedPosts = [];
    communities.forEach((c) => {
      if (Array.isArray(c.discussions)) {
        c.discussions.forEach((d) => {
          let riskScore = 0;
          const signals = [];

          const content = (d.content || d.title || '').toLowerCase();
          if (content.includes('http://') || content.includes('https://') || content.includes('wa.me')) {
            riskScore += 35;
            signals.push('Mencakup tautan eksternal atau kontak luar platform');
          }

          if (content.includes('promo') || content.includes('diskon 90%') || content.includes('slot terbatas')) {
            riskScore += 25;
            signals.push('Indikasi spam promosi tidak terverifikasi');
          }

          if (riskScore > 0) {
            flaggedPosts.push({
              community_name: c.name,
              post_id: d.id,
              author: d.author || 'User',
              content_snippet: d.content || d.title,
              risk_score: riskScore,
              detected_signals: signals,
            });
          }
        });
      }
    });

    return {
      flagged_posts_count: flaggedPosts.length,
      flagged_posts: flaggedPosts,
    };
  }

  // -------------------------------------------------------------
  // 6. RANKING, SEARCH, ADVERTISING & AI ABUSE
  // -------------------------------------------------------------
  getAIAbuseSignals() {
    const logs = aiUsageService.getLogs(200);
    const securityBlocks = logs.filter(
      (l) => l.metadata?.security_valid === false || l.error?.includes('injection')
    );

    return {
      total_ai_requests_monitored: logs.length,
      security_blocks_count: securityBlocks.length,
      detected_abuse_attempts: securityBlocks.map((b) => ({
        timestamp: b.timestamp,
        feature: b.feature,
        model: b.model,
        reason: b.error || 'Terdeteksi percobaan manipulasi instruksi AI',
      })),
    };
  }

  // -------------------------------------------------------------
  // 7. EXECUTIVE RISK OVERVIEW
  // -------------------------------------------------------------
  getRiskOverview(dbStores = {}) {
    const accountRisk = this.getAccountRisk(dbStores);
    const vendorRisk = this.getVendorRisk(dbStores);
    const bookingRisk = this.getBookingRisk(dbStores);
    const paymentRisk = this.getPaymentRisk(dbStores);
    const reviewRisk = this.getReviewRisk(dbStores);
    const communityRisk = this.getCommunityRisk(dbStores);
    const aiAbuse = this.getAIAbuseSignals();

    // Composite System Risk Score calculation
    const highRiskAccountsCount = accountRisk.high_risk_accounts.length;
    const highRiskVendorsCount = vendorRisk.flagged_vendors.length;
    const suspiciousBookingsCount = bookingRisk.suspicious_bookings.length;
    const suspiciousPaymentsCount = paymentRisk.suspicious_transactions.length;

    let overallRiskScore = 15; // baseline healthy
    if (highRiskAccountsCount > 0) overallRiskScore += 15;
    if (highRiskVendorsCount > 0) overallRiskScore += 20;
    if (suspiciousBookingsCount > 0) overallRiskScore += 15;
    if (suspiciousPaymentsCount > 0) overallRiskScore += 15;

    overallRiskScore = Math.min(100, overallRiskScore);
    const overallRiskLevel =
      overallRiskScore >= 75 ? 'CRITICAL' : overallRiskScore >= 50 ? 'HIGH' : overallRiskScore >= 25 ? 'MEDIUM' : 'LOW';

    return {
      system_risk_score: overallRiskScore,
      system_risk_level: overallRiskLevel,
      open_cases_count: null,
      risk_cases_available: false,
      risk_breakdown: {
        high_risk_accounts: highRiskAccountsCount,
        flagged_vendors: highRiskVendorsCount,
        suspicious_bookings: suspiciousBookingsCount,
        suspicious_payments: suspiciousPaymentsCount,
        flagged_reviews: reviewRisk.flagged_reviews.length,
        flagged_community_posts: communityRisk.flagged_posts_count,
        ai_abuse_attempts: aiAbuse.security_blocks_count,
      },
      latest_cases: [],
    };
  }

  // -------------------------------------------------------------
  // 8. CASE MANAGEMENT
  // -------------------------------------------------------------
  getRiskCases() {
    throw new Error('REAL_DATA_REQUIRED: risk case persistence is not configured');
  }

  createRiskCase() {
    throw new Error('REAL_DATA_REQUIRED: risk case persistence is not configured');
  }

  updateRiskCaseStatus() {
    throw new Error('REAL_DATA_REQUIRED: risk case persistence is not configured');
  }

  async explainCaseRisk() {
    throw new Error('REAL_DATA_REQUIRED: risk case persistence is not configured');
  }

}

module.exports = new AIRiskEngineService();
