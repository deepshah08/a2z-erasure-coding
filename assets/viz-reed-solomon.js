/* ==========================================================================
   Erasure Coding & Storage Math, Bit by Bit — Reed-Solomon & Matrix Math
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 05. Reed-Solomon Encoding: Vandermonde Distribution Matrix
   * -------------------------------------------------------------------------- */
  OS.register('reedSolomonVandermonde', function (host) {
    let k = 4; // data blocks
    let m = 2; // parity blocks
    let dataBlocks = [10, 25, 42, 88];
    let parityBlocks = [73, 114];
    let statusText = 'Reed-Solomon RS(4,2): Distribution matrix G = [Identity(4x4) | Vandermonde(2x4)]ᵀ. Generates 4 data + 2 parity blocks.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Encode Data Vector (Matrix Multiply)', () => {
      // Simulate matrix multiplication over GF(2^8)
      parityBlocks = [ (dataBlocks[0] ^ dataBlocks[1] ^ dataBlocks[2] ^ dataBlocks[3]) + 15, (dataBlocks[0] + 2*dataBlocks[1]) % 255 ];
      statusText = `ENCODED: Multiplied [${dataBlocks.join(', ')}] by Generator Matrix G. Parity: P1=${parityBlocks[0]}, P2=${parityBlocks[1]}.`;
      render();
    }, { primary: true });

    OS.button(controls, 'Mutate Data Block D1', () => {
      dataBlocks[0] = (dataBlocks[0] + 5) % 100;
      parityBlocks = [ (dataBlocks[0] ^ dataBlocks[1] ^ dataBlocks[2] ^ dataBlocks[3]) + 15, (dataBlocks[0] + 2*dataBlocks[1]) % 255 ];
      statusText = `UPDATED: Data D1 modified to ${dataBlocks[0]}. Recomputed parities P1, P2.`;
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Reed-Solomon Vandermonde Matrix Encoding: [D₁, D₂, D₃, D₄] ➔ [P₁, P₂]`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Blocks layout
        const totalBlocks = [...dataBlocks.map((d, i) => ({ name: `D${i+1}`, val: d, isP: false })),
                             ...parityBlocks.map((p, i) => ({ name: `P${i+1}`, val: p, isP: true }))];

        const bW = Math.min(65, (w - 60) / totalBlocks.length);
        const bH = 80;
        const startY = 75;

        totalBlocks.forEach((b, idx) => {
          const bx = 16 + idx * (bW + 10);

          ctx.fillStyle = b.isP ? OS.rgba(OS.C.teal, 0.15) : OS.rgba(OS.C.accent, 0.15);
          ctx.strokeStyle = b.isP ? OS.C.teal : OS.C.accent;
          ctx.beginPath();
          ctx.roundRect(bx, startY, bW, bH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(11, 'mono', 700);
          ctx.fillText(b.name, bx + 8, startY + 22);

          ctx.font = OS.font(12, 'mono', 800);
          ctx.fillStyle = b.isP ? OS.C.teal : OS.C.accent;
          ctx.fillText(`${b.val}`, bx + 8, startY + 50);

          ctx.font = OS.font(9, 'sans', 400);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(b.isP ? 'Parity' : 'Data', bx + 8, startY + 70);
        });

        // Matrix equation note
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Codeword vector C = G · D. Maximum Distance Separable (MDS) code guarantees optimal resilience.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 06. Cauchy Reed-Solomon Matrices & XOR Bitmatrices
   * -------------------------------------------------------------------------- */
  OS.register('cauchyBitmatrix', function (host) {
    let mode = 'CAUCHY_BITMATRIX';
    let xorInstructions = 18;
    let statusMsg = 'Cauchy Reed-Solomon: Replaces field elements with 8x8 binary bitmatrices. Every operation is pure CPU XOR!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Generate 8x8 Bitmatrix for GF Element', () => {
      xorInstructions += 4;
      statusMsg = 'BITMATRIX PROJECTION: Field element 0x57 expanded to 8x8 binary XOR matrix. Zero field multiplications needed!';
      render();
    }, { primary: true });

    OS.button(controls, 'Simulate SIMD XOR (AVX-512 / NEON)', () => {
      statusMsg = 'SIMD ACCELERATION: Intel AVX-512 _mm512_xor_si512 processes 64 bytes of parity per single clock cycle!';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Cauchy Reed-Solomon: Converting Galois Field Math to Fast XOR Bitmatrices`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(statusMsg, 16, 46);

        // 8x8 Bitmatrix Graphic
        const startX = 24;
        const startY = 75;
        const cellSize = 14;

        // Sample 8x8 Cauchy bitmatrix
        const bitmatrix = [
          [1, 0, 1, 1, 0, 0, 1, 0],
          [0, 1, 0, 1, 1, 0, 0, 1],
          [1, 0, 0, 0, 1, 1, 0, 0],
          [0, 1, 0, 0, 0, 1, 1, 0],
          [0, 0, 1, 0, 0, 0, 1, 1],
          [1, 0, 1, 0, 0, 0, 0, 1],
          [1, 1, 0, 1, 0, 0, 0, 0],
          [0, 1, 1, 0, 1, 0, 0, 0]
        ];

        bitmatrix.forEach((row, r) => {
          row.forEach((val, c) => {
            ctx.fillStyle = val === 1 ? OS.C.accent : OS.rgba(OS.C.muted, 0.1);
            ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize - 2, cellSize - 2);
          });
        });

        // Description beside matrix
        const textX = startX + 8 * cellSize + 24;
        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('8x8 Cauchy Binary Schedule', textX, startY + 20);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('• Element a_i,j = 1 / (x_i ⊕ y_j)', textX, startY + 44);
        ctx.fillText('• Guarantees every submatrix is invertible', textX, startY + 64);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('• 10x faster than Vandermonde in software!', textX, startY + 86);

        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Jerasure implementation (Jim Plank) compiles bitmatrices into optimized XOR schedules.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 07. Erasure Decoding: Inverting the Surviving Submatrix
   * -------------------------------------------------------------------------- */
  OS.register('matrixInversionDecode', function (host) {
    let failedNodes = ['D2', 'D4'];
    let surviving = ['D1', 'D3', 'P1', 'P2'];
    let state = 'FAILED'; // 'FAILED', 'INVERTING', 'RECONSTRUCTED'
    let logMsg = 'Data Loss Event: D2 and D4 failed simultaneously! 4 surviving blocks (D1, D3, P1, P2) sufficient to recover.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, '1. Form Submatrix A from Surviving Rows', () => {
      state = 'INVERTING';
      logMsg = 'SUBMATRIX FORMED: Extracted rows corresponding to [D1, D3, P1, P2] from Generator Matrix G.';
      render();
    }, { primary: true });

    OS.button(controls, '2. Invert Submatrix (Gaussian Elimination)', () => {
      state = 'RECONSTRUCTED';
      logMsg = '✓ INVERSION SUCCESS: Computed A⁻¹ over GF(2^8). Multiplied A⁻¹ · D_surviving ➔ D2 and D4 fully restored!';
      render();
    });

    OS.button(controls, 'Reset Node Failures', () => {
      state = 'FAILED';
      logMsg = 'Reset failure state: D2 and D4 crashed.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Erasure Decoding Engine: Solving Linear System A · D = C' ➔ D = A⁻¹ · C'`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = state === 'RECONSTRUCTED' ? OS.C.green : (state === 'INVERTING' ? OS.C.amber : OS.C.red);
        ctx.fillText(logMsg, 16, 46);

        // Draw 6 node statuses
        const nodes = [
          { name: 'D1', ok: true },
          { name: 'D2', ok: state === 'RECONSTRUCTED' },
          { name: 'D3', ok: true },
          { name: 'D4', ok: state === 'RECONSTRUCTED' },
          { name: 'P1', ok: true, isP: true },
          { name: 'P2', ok: true, isP: true }
        ];

        const nW = Math.min(65, (w - 60) / nodes.length);
        const nH = 75;
        const startY = 75;

        nodes.forEach((n, idx) => {
          const nx = 16 + idx * (nW + 10);

          ctx.fillStyle = n.ok ? (n.isP ? OS.rgba(OS.C.teal, 0.15) : OS.rgba(OS.C.accent, 0.15)) : OS.rgba(OS.C.red, 0.2);
          ctx.strokeStyle = n.ok ? (n.isP ? OS.C.teal : OS.C.accent) : OS.C.red;
          ctx.beginPath();
          ctx.roundRect(nx, startY, nW, nH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(11, 'mono', 700);
          ctx.fillText(n.name, nx + 8, startY + 22);

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = n.ok ? OS.C.green : OS.C.red;
          ctx.fillText(n.ok ? 'ONLINE' : 'DEAD', nx + 8, startY + 45);

          ctx.font = OS.font(8, 'sans', 400);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(n.isP ? 'Parity' : 'Data', nx + 8, startY + 64);
        });

        // Summary footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Theorem: In an RS(k, m) MDS code, ANY k surviving blocks can reconstruct ALL k original data blocks.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 08. Systematic vs Non-Systematic Codes & Zero-Copy Data
   * -------------------------------------------------------------------------- */
  OS.register('systematicCoding', function (host) {
    let isSystematic = true;
    let readSpeed = 'Zero-Copy Direct Disk Read (100% Native Speed)';
    let statusText = 'Systematic Code: Original data blocks are stored verbatim in plaintext. Reads require ZERO CPU decoding overhead!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Coding Type', [
      { value: 'SYSTEMATIC', label: 'Systematic Code (Top k rows = Identity Matrix I_k)' },
      { value: 'NON_SYSTEMATIC', label: 'Non-Systematic Code (All blocks transformed into parity)' }
    ], (val) => {
      isSystematic = val === 'SYSTEMATIC';
      if (isSystematic) {
        readSpeed = 'Zero-Copy Direct Disk Read (100% Native Speed)';
        statusText = 'Systematic: Normal client read touches DataNode directly via zero-copy DMA without decoding.';
      } else {
        readSpeed = 'CPU Decoding Required for EVERY read (High CPU & Latency penalty)';
        statusText = 'Non-Systematic: Impractical for distributed filesystems! Every read requires matrix multiplication.';
      }
      render();
    });

    OS.button(controls, 'Client Reads Block D1', () => {
      statusText = isSystematic 
        ? '✓ ZERO-COPY READ: DataNode streamed block D1 directly to client socket via splice()/sendfile().'
        : '⚠️ DECODING OVERHEAD: Client had to fetch all blocks and run matrix multiplication just to read 1 block!';
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Systematic vs Non-Systematic Codes: Zero-Copy Storage Architecture`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = isSystematic ? OS.C.green : OS.C.red;
        ctx.fillText(statusText, 16, 46);

        // Comparison cards
        const cardW = Math.min(220, (w - 48) / 2);
        const cardH = 95;
        const startY = 75;

        // Normal Read Card
        ctx.fillStyle = isSystematic ? OS.rgba(OS.C.accent, 0.15) : OS.rgba(OS.C.red, 0.15);
        ctx.strokeStyle = isSystematic ? OS.C.accent : OS.C.red;
        ctx.beginPath();
        ctx.roundRect(16, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Client Read Path', 26, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText(isSystematic ? '• Reads Plaintext Directly' : '• Requires Matrix Inversion', 26, startY + 44);
        ctx.fillStyle = isSystematic ? OS.C.accent : OS.C.red;
        ctx.fillText(isSystematic ? 'Zero CPU Overhead' : 'High CPU Latency', 26, startY + 68);

        // Matrix structure Card
        const x2 = 16 + cardW + 16;
        ctx.fillStyle = OS.rgba(OS.C.teal, 0.1);
        ctx.strokeStyle = OS.C.teal;
        ctx.beginPath();
        ctx.roundRect(x2, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Generator Matrix G', x2 + 10, startY + 22);
        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillText(isSystematic ? '[ I_k (Identity) ] (k x k)' : '[ Vandermonde ] (k x k)', x2 + 10, startY + 44);
        ctx.fillText('[ Vandermonde ] (m x k)', x2 + 10, startY + 68);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('HDFS, Ceph, and MinIO exclusively use Systematic codes so degraded mode runs only during failures.', 16, h - 16);
      }
    });
    render();
  });

})();
