/* ==========================================================================
   Erasure Coding & Storage Math, Bit by Bit — Galois Fields & Parity
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 00. Hero: HDFS Erasure Coding vs 3x Replication Arena
   * -------------------------------------------------------------------------- */
  OS.register('ecHero', function (host) {
    let policy = 'RS_6_3'; // '3X_REP', 'RS_6_3', 'RS_10_4'
    let rawPb = 100; // 100 Petabytes user data
    let storageOverhead = 150; // % total stored
    let storedPb = 150;
    let faultTolerance = 'Any 3 nodes can fail without data loss';
    let heroMsg = 'HDFS RS(6,3) Erasure Coding: 50% storage overhead vs 200% for 3x Replication. Saves 150 Petabytes of physical disk!';

    function updatePolicy() {
      if (policy === '3X_REP') {
        storageOverhead = 200; // 3x total = 300 PB stored (200% overhead)
        storedPb = 300;
        faultTolerance = 'Any 2 nodes can fail without data loss';
        heroMsg = '3x Replication: 300 PB physical disk required for 100 PB user data (200% storage overhead!). Fast reads, massive disk waste.';
      } else if (policy === 'RS_6_3') {
        storageOverhead = 50; // 1.5x total = 150 PB stored (50% overhead)
        storedPb = 150;
        faultTolerance = 'Any 3 nodes can fail simultaneously without data loss';
        heroMsg = 'RS(6,3) Erasure Coding: 150 PB physical disk for 100 PB data (50% overhead). Saves 150 Petabytes of datacenter storage!';
      } else {
        // RS(10,4)
        storageOverhead = 40; // 1.4x total = 140 PB stored (40% overhead)
        storedPb = 140;
        faultTolerance = 'Any 4 nodes can fail simultaneously without data loss';
        heroMsg = 'RS(10,4) Erasure Coding: 140 PB disk for 100 PB data (33.3% overhead). Maximizes storage density for cold archival clusters!';
      }
      render();
    }

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Storage Policy', [
      { value: 'RS_6_3', label: 'HDFS RS(6,3) Erasure Coding (Default in HDFS 3.0)' },
      { value: 'RS_10_4', label: 'HDFS RS(10,4) Erasure Coding (Maximum Density)' },
      { value: '3X_REP', label: 'Legacy 3x Replication (200% Storage Overhead)' }
    ], (val) => {
      policy = val;
      updatePolicy();
    });

    OS.button(controls, 'Simulate 3 Node Failures', () => {
      if (policy === '3X_REP') {
        heroMsg = '⚠️ POTENTIAL DATA LOSS: If 3 replicas of the same block fail simultaneously, data is unrecoverable!';
      } else {
        heroMsg = '✓ FULL DATA RECONSTRUCTION: RS survived 3 node losses! Parity matrix inversion rebuilt all lost blocks.';
      }
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 260,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('Distributed Storage Economics: Erasure Coding vs 3x Replication', 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = policy === '3X_REP' ? OS.C.red : OS.C.green;
        ctx.fillText(heroMsg, 16, 46);

        // Comparison Bar Chart
        const barX = 16;
        const barY = 75;
        const barW = Math.min(480, w - 32);
        const barH = 36;

        // Container
        ctx.fillStyle = OS.rgba(OS.C.muted, 0.1);
        ctx.strokeStyle = OS.C.border;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();
        ctx.stroke();

        // Used storage fill (Relative to 300PB max)
        const fillW = (storedPb / 300) * barW;
        ctx.fillStyle = policy === '3X_REP' ? OS.C.red : OS.C.accent;
        ctx.fillRect(barX, barY, fillW, barH);

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillText(`Raw Data: 100 PB | Stored Footprint: ${storedPb} PB (+${storageOverhead}%)`, barX + 8, barY + 22);

        // Cards summary
        const cardY = barY + barH + 25;
        const cardW = Math.min(220, (w - 48) / 2);
        const cardH = 85;

        // Fault tolerance card
        ctx.fillStyle = OS.rgba(OS.C.teal, 0.12);
        ctx.strokeStyle = OS.C.teal;
        ctx.beginPath();
        ctx.roundRect(16, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Fault Tolerance', 26, cardY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText(faultTolerance, 26, cardY + 44);
        ctx.fillStyle = OS.C.teal;
        ctx.fillText(policy === '3X_REP' ? 'Replicas: 3 copies' : 'MDS: Cauchy Matrix', 26, cardY + 66);

        // Economics card
        const x2 = 16 + cardW + 16;
        ctx.fillStyle = OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(x2, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Datacenter Savings', x2 + 10, cardY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText(`Storage Reduction: ${300 - storedPb} Petabytes`, x2 + 10, cardY + 44);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText(`Drive Count: ${((storedPb / 300) * 100).toFixed(0)}% of 3x cluster`, x2 + 10, cardY + 66);
      }
    });
    updatePolicy();
  });

  /* --------------------------------------------------------------------------
   * 01. Simple Parity, Hamming Distance & RAID-5 / RAID-6 Dual Parity
   * -------------------------------------------------------------------------- */
  OS.register('raidParityMatrix', function (host) {
    let d1 = 12; // 0000 1100
    let d2 = 9;  // 0000 1001
    let d3 = 5;  // 0000 0101
    let parity = d1 ^ d2 ^ d3; // P = D1 ^ D2 ^ D3 = 0
    let failedDisk = null; // 'D2'
    let logMsg = 'RAID-5 XOR Parity: P = D1 ⊕ D2 ⊕ D3. Any single lost disk can be reconstructed via XOR!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Simulate Disk 2 Failure', () => {
      failedDisk = 'D2';
      logMsg = '⚡ DISK 2 CRASHED: D2 lost! Reconstruction: D2 = D1 ⊕ D3 ⊕ Parity.';
      render();
    }, { primary: true });

    OS.button(controls, 'Reconstruct Lost Disk (XOR)', () => {
      if (failedDisk === 'D2') {
        const reconstructed = d1 ^ d3 ^ parity;
        logMsg = `✓ DISK 2 RECONSTRUCTED: D1 (${d1}) ⊕ D3 (${d3}) ⊕ P (${parity}) = ${reconstructed} (Original D2 restored!).`;
        failedDisk = null;
      }
      render();
    });

    OS.button(controls, 'Reset Disks', () => {
      failedDisk = null;
      parity = d1 ^ d2 ^ d3;
      logMsg = 'All disks healthy.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('RAID-5 Single-Parity Invariant & XOR Bitwise Reconstruction', 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = failedDisk ? OS.C.red : OS.C.green;
        ctx.fillText(logMsg, 16, 46);

        // Draw 4 Disks (D1, D2, D3, Parity)
        const disks = [
          { name: 'Disk 1 (D1)', val: d1, bin: '00001100', failed: failedDisk === 'D1' },
          { name: 'Disk 2 (D2)', val: d2, bin: '00001001', failed: failedDisk === 'D2' },
          { name: 'Disk 3 (D3)', val: d3, bin: '00000101', failed: failedDisk === 'D3' },
          { name: 'Parity (P)', val: parity, bin: '00000000', failed: false, isP: true }
        ];

        const diskW = Math.min(105, (w - 60) / disks.length);
        const diskH = 95;
        const startY = 80;

        disks.forEach((d, idx) => {
          const dx = 16 + idx * (diskW + 12);

          ctx.fillStyle = d.failed ? OS.rgba(OS.C.red, 0.2) : (d.isP ? OS.rgba(OS.C.teal, 0.15) : OS.rgba(OS.C.accent, 0.1));
          ctx.strokeStyle = d.failed ? OS.C.red : (d.isP ? OS.C.teal : OS.C.border);
          ctx.lineWidth = d.failed ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(dx, startY, diskW, diskH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(11, 'mono', 700);
          ctx.fillText(d.name, dx + 6, startY + 22);

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = d.failed ? OS.C.red : (d.isP ? OS.C.teal : OS.C.accent);
          ctx.fillText(d.failed ? 'DEAD' : `Byte: ${d.val}`, dx + 6, startY + 45);

          ctx.font = OS.font(9, 'mono', 400);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(d.failed ? '???' : d.bin, dx + 6, startY + 68);
        });

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Limitation: RAID-5 cannot survive 2 simultaneous disk failures. RAID-6 introduces Q parity via Galois Fields.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 02. Galois Field GF(2^8) Arithmetic & Primitive Polynomials
   * -------------------------------------------------------------------------- */
  OS.register('galoisFieldMul', function (host) {
    let byteA = 0x57; // 87
    let byteB = 0x83; // 131
    let primPoly = 0x11D; // x^8 + x^4 + x^3 + x^2 + 1 (AES / Jerasure standard)
    let product = 0xC1;
    let logMsg = 'Galois Field GF(2^8): Closed finite field of 256 bytes. Addition is XOR; Multiplication is polynomial modulo 0x11D.';

    function gfMultiply(a, b) {
      let p = 0;
      for (let i = 0; i < 8; i++) {
        if (b & 1) p ^= a;
        const hiBitSet = a & 0x80;
        a = (a << 1) & 0xFF;
        if (hiBitSet) a ^= 0x1D; // reduce modulo x^8 + x^4 + x^3 + x^2 + 1
        b >>= 1;
      }
      return p;
    }

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Operands (Hex)', [
      { value: '57x83', label: '0x57 (87) ⊗ 0x83 (131) = 0xC1 (Standard Test Vector)' },
      { value: '02x0F', label: '0x02 (Double) ⊗ 0x0F (15) = 0x1E' },
      { value: '80x02', label: '0x80 (128) ⊗ 0x02 (2) = 0x1B (Triggers Modulo Reduction)' }
    ], (val) => {
      if (val === '57x83') { byteA = 0x57; byteB = 0x83; }
      else if (val === '02x0F') { byteA = 0x02; byteB = 0x0F; }
      else { byteA = 0x80; byteB = 0x02; }
      product = gfMultiply(byteA, byteB);
      logMsg = `GF(2^8) 0x${byteA.toString(16).toUpperCase()} ⊗ 0x${byteB.toString(16).toUpperCase()} = 0x${product.toString(16).toUpperCase()} (${product}).`;
      render();
    });

    OS.button(controls, 'Calculate Addition (XOR)', () => {
      const sum = byteA ^ byteB;
      logMsg = `GF(2^8) ADDITION: 0x${byteA.toString(16)} ⊕ 0x${byteB.toString(16)} = 0x${sum.toString(16).toUpperCase()} (${sum}). Zero carries!`;
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('Finite Field GF(2^8) Arithmetic Engine (Primitive Poly: x⁸+x⁴+x³+x²+1)', 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(logMsg, 16, 46);

        // Visual Math Card
        const cardX = 16;
        const cardY = 75;
        const cardW = Math.min(480, w - 32);
        const cardH = 110;

        ctx.fillStyle = OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Galois Field Multiplication Steps:', cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillText(`• Byte A: 0x${byteA.toString(16).toUpperCase()} (Binary: ${byteA.toString(2).padStart(8, '0')})`, cardX + 14, cardY + 48);
        ctx.fillText(`• Byte B: 0x${byteB.toString(16).toUpperCase()} (Binary: ${byteB.toString(2).padStart(8, '0')})`, cardX + 14, cardY + 70);

        ctx.fillStyle = OS.C.accent;
        ctx.fillText(`• Product A ⊗ B in GF(2^8) = 0x${product.toString(16).toUpperCase()} (Never overflows 1 byte!)`, cardX + 14, cardY + 92);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Because results never exceed 255 (8 bits), computers manipulate data in-place without precision loss.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 03. Galois Field Log/Antilog Tables & Fast Multiplication
   * -------------------------------------------------------------------------- */
  OS.register('gfLookupTables', function (host) {
    let valA = 7;
    let valB = 9;
    let logA = 198;
    let logB = 227;
    let sumLog = (logA + logB) % 255;
    let result = 63;
    let statusText = 'Log/Antilog Tables: Converts costly GF(2^8) polynomial division into O(1) table lookups!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Compute via Table Lookup: A ⊗ B', () => {
      statusText = `TABLE LOOKUP: log[${valA}]=${logA}, log[${valB}]=${logB} -> antilog[(198+227) mod 255] = antilog[170] = ${result}. Exactly 3 array reads!`;
      render();
    }, { primary: true });

    OS.button(controls, 'Reset Operands', () => {
      statusText = 'State reset.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`High-Performance Software Coding: GF(2^8) Log / Antilog Lookup Tables`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Formula pipeline
        const steps = [
          { name: '1. gf_log[A]', val: `${logA}` },
          { name: '2. gf_log[B]', val: `${logB}` },
          { name: '3. Add Mod 255', val: `${sumLog}` },
          { name: '4. gf_antilog[]', val: `${result}` }
        ];

        const boxW = Math.min(105, (w - 60) / steps.length);
        const boxH = 75;
        const startY = 80;

        steps.forEach((s, idx) => {
          const bx = 16 + idx * (boxW + 12);

          ctx.fillStyle = OS.rgba(OS.C.accent, 0.1);
          ctx.strokeStyle = OS.C.accent;
          ctx.beginPath();
          ctx.roundRect(bx, startY, boxW, boxH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(10, 'mono', 700);
          ctx.fillText(s.name, bx + 6, startY + 22);

          ctx.font = OS.font(12, 'mono', 800);
          ctx.fillStyle = OS.C.accent;
          ctx.fillText(s.val, bx + 6, startY + 50);

          if (idx < steps.length - 1) {
            ctx.strokeStyle = OS.C.muted;
            ctx.beginPath();
            ctx.moveTo(bx + boxW, startY + boxH / 2);
            ctx.lineTo(bx + boxW + 12, startY + boxH / 2);
            ctx.stroke();
          }
        });

        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Jerasure / Intel ISA-L precomputes 256-byte gf_log and gf_antilog tables in L1 CPU cache.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 04. Shannon Information Entropy & Theoretical Lower Bounds
   * -------------------------------------------------------------------------- */
  OS.register('shannonEntropy', function (host) {
    let entropyBits = 1.35; // bits per byte
    let datasetType = 'LOG_TEXT'; // 'RANDOM', 'LOG_TEXT', 'ZERO_PADDED'
    let compressionRatio = '83% reduction';
    let statusMsg = 'Shannon Entropy H(X): The theoretical lower bound of lossless compression.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Data Profile', [
      { value: 'LOG_TEXT', label: 'Repetitive Log File (Low Entropy H = 1.35 bits/byte)' },
      { value: 'ZERO_PADDED', label: 'Sparse Zero-Filled Blocks (Near-Zero Entropy H = 0.12)' },
      { value: 'RANDOM', label: 'AES Encrypted / Random Media (Max Entropy H = 7.99 bits/byte)' }
    ], (val) => {
      datasetType = val;
      if (val === 'LOG_TEXT') {
        entropyBits = 1.35;
        compressionRatio = '83% reduction (Compresses to 1.35 bits/char)';
        statusMsg = 'Highly compressible: Skewed character frequencies provide huge Shannon redundancy.';
      } else if (val === 'ZERO_PADDED') {
        entropyBits = 0.12;
        compressionRatio = '98.5% reduction (Near-infinite RLE compression)';
        statusMsg = 'Extreme redundancy: Single dominant symbol approach zero entropy.';
      } else {
        entropyBits = 7.99;
        compressionRatio = '0% reduction (Incompressible)';
        statusMsg = 'MAXIMUM ENTROPY: Uniform random distribution. Cannot be compressed losslessly (Shannon Theorem)!';
      }
      render();
    });

    OS.button(controls, 'Calculate Shannon Entropy', () => {
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Claude Shannon's Information Entropy: H(X) = -Σ p(x) log₂ p(x)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = entropyBits > 7.5 ? OS.C.red : OS.C.green;
        ctx.fillText(statusMsg, 16, 46);

        // Entropy meter
        const barX = 16;
        const barY = 75;
        const barW = Math.min(480, w - 32);
        const barH = 36;

        ctx.fillStyle = OS.rgba(OS.C.muted, 0.1);
        ctx.strokeStyle = OS.C.border;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();
        ctx.stroke();

        const entW = (entropyBits / 8.0) * barW;
        ctx.fillStyle = entropyBits > 7.5 ? OS.C.red : (entropyBits > 4 ? OS.C.amber : OS.C.accent);
        ctx.fillRect(barX, barY, entW, barH);

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillText(`Entropy: ${entropyBits} / 8.00 bits per byte (${compressionRatio})`, barX + 8, barY + 22);

        // Card summary
        const cardY = barY + barH + 28;
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Shannon Source Coding Theorem: No compression algorithm can represent data in fewer than H(X) bits on average.', 16, cardY);
      }
    });
    render();
  });

})();
