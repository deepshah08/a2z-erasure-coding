/* ==========================================================================
   Erasure Coding & Storage Math, Bit by Bit — HDFS, LRC & Compression
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 09. HDFS 3.0 Striped Erasure Coding: 1MB Cell Striping vs Block EC
   * -------------------------------------------------------------------------- */
  OS.register('hdfsStriping', function (host) {
    let cellSizeKb = 1024; // 1MB cell
    let fileSizeMb = 12; // 12MB file
    let layout = 'STRIPED'; // 'STRIPED' vs 'CONTIGUOUS'
    let statusText = 'HDFS Striped EC: Files split into 1MB cells striped across 6 DataNodes + 3 Parity nodes concurrently.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'EC Layout', [
      { value: 'STRIPED', label: 'Online Striped Layout (1MB Cells — HDFS 3.0 Default)' },
      { value: 'CONTIGUOUS', label: 'Contiguous Block Layout (Full 128MB Blocks — Legacy)' }
    ], (val) => {
      layout = val;
      statusText = val === 'STRIPED'
        ? 'Striped (RS-6-3-1024k): Small & medium files take advantage of all 6 DataNode network interfaces simultaneously!'
        : 'Contiguous: Entire 128MB block stored on 1 node. Small files cannot leverage EC without padding waste.';
      render();
    });

    OS.button(controls, 'Stream 6MB Chunk Across Nodes', () => {
      statusText = layout === 'STRIPED'
        ? 'PARALLEL WRITE: 6MB written as 1MB cell to Node 1..6 concurrently in single round-trip time!'
        : 'SEQUENTIAL WRITE: 6MB streamed to single primary DataNode pipeline.';
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`HDFS 3.0 Erasure Coding: 1MB Cell Striping Architecture (RS-6-3-1024k)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Nodes grid (6 Data + 3 Parity)
        const nodes = [
          { name: 'DN1', type: 'D1' }, { name: 'DN2', type: 'D2' }, { name: 'DN3', type: 'D3' },
          { name: 'DN4', type: 'D4' }, { name: 'DN5', type: 'D5' }, { name: 'DN6', type: 'D6' },
          { name: 'DN7', type: 'P1' }, { name: 'DN8', type: 'P2' }, { name: 'DN9', type: 'P3' }
        ];

        const nW = Math.min(42, (w - 60) / nodes.length);
        const nH = 80;
        const startY = 75;

        nodes.forEach((n, idx) => {
          const nx = 16 + idx * (nW + 8);
          const isP = n.type.startsWith('P');

          ctx.fillStyle = isP ? OS.rgba(OS.C.teal, 0.15) : OS.rgba(OS.C.accent, 0.15);
          ctx.strokeStyle = isP ? OS.C.teal : OS.C.accent;
          ctx.beginPath();
          ctx.roundRect(nx, startY, nW, nH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(9, 'mono', 700);
          ctx.fillText(n.name, nx + 4, startY + 20);

          ctx.font = OS.font(10, 'mono', 800);
          ctx.fillStyle = isP ? OS.C.teal : OS.C.accent;
          ctx.fillText(n.type, nx + 4, startY + 45);

          ctx.font = OS.font(8, 'sans', 400);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText('1MB', nx + 4, startY + 65);
        });

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Striped cells eliminate the small file penalty in HDFS without requiring multi-block padding.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 10. The Degraded Read Problem & Single-Disk Network Repair Penalty
   * -------------------------------------------------------------------------- */
  OS.register('degradedReadPenalty', function (host) {
    let k = 6;
    let blockSizeMb = 128;
    let networkTrafficMb = 768; // k * 128MB = 6 * 128 = 768MB to reconstruct 1 block!
    let penaltyRatio = 6;
    let statusText = 'The Degraded Read Problem: In RS(6,3), losing 1 block requires downloading 6 survivor blocks (6x network traffic) to rebuild!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Simulate Single Block Loss (Node 2)', () => {
      networkTrafficMb = k * blockSizeMb;
      statusText = `DEGRADED READ: Client must download ${networkTrafficMb}MB across network from 6 surviving nodes to reconstruct 1 lost 128MB block!`;
      render();
    }, { primary: true });

    OS.button(controls, 'Compare with 3x Replication Repair', () => {
      networkTrafficMb = blockSizeMb;
      statusText = `3x REPLICATION REPAIR: Only 128MB transferred from one surviving replica. (1x network traffic vs 6x for RS!).`;
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`The Degraded Read Bottleneck: Network Amplification during Single-Drive Repair`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = networkTrafficMb > 200 ? OS.C.amber : OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Network traffic bar
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

        const netW = Math.min(barW, (networkTrafficMb / 768) * barW);
        ctx.fillStyle = networkTrafficMb > 200 ? OS.C.amber : OS.C.green;
        ctx.fillRect(barX, barY, netW, barH);

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillText(`Network Ingest for 1 Block: ${networkTrafficMb} MB transferred (${networkTrafficMb / blockSizeMb}x amplification)`, barX + 8, barY + 22);

        // Card summary
        const cardY = barY + barH + 28;
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('98% of datacenter storage failures are single-disk failures. Standard RS wastes massive top-of-rack switch bandwidth.', 16, cardY);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 11. Locally Repairable Codes (LRC): Microsoft Azure & HDFS
   * -------------------------------------------------------------------------- */
  OS.register('locallyRepairableCodes', function (host) {
    let code = 'LRC_12_2_2'; // (12, 2, 2)
    let repairIO = 6; // nodes needed for single failure
    let statusText = 'Locally Repairable Codes (LRC): Partitions data into local parity groups. Single failures require reading only 6 nodes instead of 12!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Code Architecture', [
      { value: 'LRC_12_2_2', label: 'LRC(12, 2, 2) (Azure Storage & HDFS LRC — 6-node local repair)' },
      { value: 'STANDARD_RS_12_4', label: 'Standard RS(12, 4) (MDS — Requires 12 nodes for any single repair)' }
    ], (val) => {
      code = val;
      if (val === 'LRC_12_2_2') {
        repairIO = 6;
        statusText = 'LRC: Group 1 has local parity P_local1. Single failure in D1..D6 repaired by reading only 6 blocks!';
      } else {
        repairIO = 12;
        statusText = 'Standard RS: Any single block loss requires reading ALL 12 data blocks across the network!';
      }
      render();
    });

    OS.button(controls, 'Simulate Single Block Repair', () => {
      statusText = `REPAIR EXECUTED: Read ${repairIO} nodes across cluster network. Network bandwidth savings: ${code === 'LRC_12_2_2' ? '50% SAVED!' : '0% (Full MDS penalty)'}.`;
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Locally Repairable Codes (LRC): Reducing Single-Disk Repair Network I/O`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = repairIO <= 6 ? OS.C.green : OS.C.amber;
        ctx.fillText(statusText, 16, 46);

        // Structure Cards
        const cardW = Math.min(220, (w - 48) / 2);
        const cardH = 95;
        const startY = 75;

        // Group 1
        ctx.fillStyle = OS.rgba(OS.C.accent, 0.12);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(16, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Local Group 1 (6 Data + 1 Parity)', 26, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('Data: [D1, D2, D3, D4, D5, D6]', 26, startY + 44);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('Local Parity: P_local1 (Single failure repair)', 26, startY + 68);

        // Group 2
        const x2 = 16 + cardW + 16;
        ctx.fillStyle = OS.rgba(OS.C.teal, 0.12);
        ctx.strokeStyle = OS.C.teal;
        ctx.beginPath();
        ctx.roundRect(x2, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Local Group 2 (6 Data + 1 Parity)', x2 + 10, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('Data: [D7, D8, D9, D10, D11, D12]', x2 + 10, startY + 44);
        ctx.fillStyle = OS.C.teal;
        ctx.fillText('Global Parity: P_global1, P_global2', x2 + 10, startY + 68);

        // Footer
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(`Single-Failure Repair Read Complexity: ${repairIO} nodes (Azure WAS / HDFS LRC saves 50% repair traffic).`, 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 12. Hitchhiker / Piggybacking Codes
   * -------------------------------------------------------------------------- */
  OS.register('hitchhikerCodes', function (host) {
    let mode = 'HITCHHIKER'; // 'STANDARD', 'HITCHHIKER'
    let networkIoMb = 64; // reads sub-chunks instead of full chunk
    let logMsg = 'Hitchhiker Code (Rashmi et al., CMU): "Piggybacks" sub-chunk linear combinations to cut repair traffic by 25-45% without extra parity overhead!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Coding Variant', [
      { value: 'HITCHHIKER', label: 'Hitchhiker Piggybacked Code (Sub-chunk repair — 35% I/O reduction)' },
      { value: 'STANDARD', label: 'Standard Reed-Solomon (Full chunk repair)' }
    ], (val) => {
      mode = val;
      networkIoMb = val === 'HITCHHIKER' ? 64 : 128;
      logMsg = val === 'HITCHHIKER'
        ? 'Hitchhiker: Encodes across 2 sub-chunks per block. Surviving nodes send only half-blocks during repair!'
        : 'Standard RS: Surviving nodes must transfer entire blocks.';
      render();
    });

    OS.button(controls, 'Reconstruct Sub-Chunk', () => {
      logMsg = `RECONSTRUCTED: Transferred ${networkIoMb}MB sub-chunks. Network load reduced!`;
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('Hitchhiker / Piggybacking Codes: Sub-Chunk I/O Savings in Distributed Storage', 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(logMsg, 16, 46);

        // Sub-chunk division card
        const cardX = 16;
        const cardY = 75;
        const cardW = Math.min(480, w - 32);
        const cardH = 95;

        ctx.fillStyle = OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText(`Block Splitting Architecture (${mode})`, cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('Each 128MB HDFS block split into two 64MB sub-chunks: [SubChunk_A, SubChunk_B].', cardX + 14, cardY + 48);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText(`Network Data Fetched per Node: ${networkIoMb} MB`, cardX + 14, cardY + 70);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Deployed in production Hadoop clusters to resolve cross-rack network congestion during daily drive rebalancing.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 13. LZ77 Sliding Window & Token Streams
   * -------------------------------------------------------------------------- */
  OS.register('lz77SlidingWindow', function (host) {
    let windowKb = 32; // 32KB dictionary window
    let matchesFound = 8;
    let bytesCompressed = 240;
    let logMsg = 'LZ77 (Lempel-Ziv 1977): Replaces repeated strings with (offset, length) back-references into the sliding window.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Emit Match Token: (Offset: 42, Len: 18)', () => {
      matchesFound++;
      bytesCompressed += 18;
      logMsg = 'MATCH ENCODED: Found 18-byte match 42 bytes back. Emitted 2-byte token [offset:42, len:18]. Saved 16 bytes!';
      render();
    }, { primary: true });

    OS.button(controls, 'Emit Literal Byte: "X"', () => {
      logMsg = 'LITERAL ENCODED: No prior match in sliding window. Emitted 1 literal byte.';
      render();
    });

    OS.button(controls, 'Reset Sliding Window', () => {
      matchesFound = 8;
      bytesCompressed = 240;
      logMsg = 'Sliding window reset.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`LZ77 Sliding Window Mechanics: Dictionary Search & Token Emission (Snappy / LZ4)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(logMsg, 16, 46);

        // Window graphic
        const winX = 16;
        const winY = 80;
        const totalW = Math.min(480, w - 32);
        const winH = 45;

        // Search Buffer (Sliding Window)
        const sW = totalW * 0.65;
        ctx.fillStyle = OS.rgba(OS.C.accent, 0.15);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(winX, winY, sW, winH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillText('Sliding History Window (32KB)', winX + 8, winY + 20);
        ctx.font = OS.font(9, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Previously seen bytes for back-reference matches', winX + 8, winY + 36);

        // Lookahead Buffer
        const lX = winX + sW + 10;
        const lW = totalW - sW - 10;
        ctx.fillStyle = OS.rgba(OS.C.teal, 0.15);
        ctx.strokeStyle = OS.C.teal;
        ctx.beginPath();
        ctx.roundRect(lX, winY, lW, winH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillText('Lookahead Buffer', lX + 8, winY + 20);
        ctx.font = OS.font(9, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Incoming unencoded stream', lX + 8, winY + 36);

        // Metrics card
        const cardY = winY + winH + 25;
        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Tokens Emitted: ${matchesFound} matches | Bytes Substituted: ${bytesCompressed}B | Decompressor: O(1) memcpy!`, 16, cardY);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 14. Huffman Coding: Prefix Trees & Variable-Length Bitstreams
   * -------------------------------------------------------------------------- */
  OS.register('huffmanEncoding', function (host) {
    let charStream = 'E E E E T T O';
    let eBits = '0';      // 1 bit
    let tBits = '10';     // 2 bits
    let oBits = '11';     // 2 bits
    let statusText = 'Huffman Coding: Frequent symbols receive short bit codes; rare symbols receive longer codes. Prefix-free tree.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Calculate Huffman Tree Weights', () => {
      statusText = 'PREFIX-FREE CODE: "E" (freq 57%) ➔ 0 (1 bit), "T" (freq 28%) ➔ 10 (2 bits), "O" (freq 15%) ➔ 11 (2 bits). Average: 1.43 bits/symbol!';
      render();
    }, { primary: true });

    OS.button(controls, 'Reset Frequencies', () => {
      statusText = 'Frequencies reset.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Huffman Coding: Optimal Prefix-Free Binary Coding Tree`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Symbols table
        const syms = [
          { char: "'E'", freq: '57%', code: '0', bits: 1 },
          { char: "'T'", freq: '28%', code: '10', bits: 2 },
          { char: "'O'", freq: '15%', code: '11', bits: 2 }
        ];

        const sW = Math.min(105, (w - 60) / syms.length);
        const sH = 80;
        const startY = 75;

        syms.forEach((s, idx) => {
          const sx = 16 + idx * (sW + 14);

          ctx.fillStyle = OS.rgba(OS.C.accent, 0.12);
          ctx.strokeStyle = OS.C.accent;
          ctx.beginPath();
          ctx.roundRect(sx, startY, sW, sH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(12, 'mono', 700);
          ctx.fillText(s.char, sx + 8, startY + 22);

          ctx.font = OS.font(10, 'mono', 500);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(`Freq: ${s.freq}`, sx + 8, startY + 44);

          ctx.fillStyle = OS.C.accent;
          ctx.font = OS.font(11, 'mono', 700);
          ctx.fillText(`Bit: ${s.code}`, sx + 8, startY + 66);
        });

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('DEFLATE (gzip, zlib, PNG) combines LZ77 dictionary matches with Huffman entropy coding.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 15. Hardware-Accelerated Data Integrity: CRC32-C (Castagnoli)
   * -------------------------------------------------------------------------- */
  OS.register('crc32Hardware', function (host) {
    let poly = 'Castagnoli (0x1EDC6F41)';
    let throughputGbps = 32.5; // SIMD accelerated
    let corruptedBit = false;
    let checksum = '0x8F215A4C';
    let statusText = 'CRC32-C: Detects all single, double, and odd-parity bit flips. Accelerated via Intel SSE4.2 / ARMv8 CRC instructions!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Inject 1-Bit Corruption (Silent Bit Rot)', () => {
      corruptedBit = true;
      checksum = '0x129B7F30';
      statusText = '🚨 BIT ROT DETECTED: Hardware CRC mismatch! Stored: 0x8F215A4C vs Computed: 0x129B7F30. Sector rejected!';
      render();
    }, { primary: true });

    OS.button(controls, 'Verify Clean Block (SSE4.2 crc32q)', () => {
      corruptedBit = false;
      checksum = '0x8F215A4C';
      statusText = '✓ INTEGRITY VERIFIED: Computed at 32.5 GB/sec via hardware crc32q instruction. Checksum matches.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Hardware-Accelerated CRC32-C Integrity Verification (PCLMULQDQ / SSE4.2)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = corruptedBit ? OS.C.red : OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Verification Card
        const cardX = 16;
        const cardY = 75;
        const cardW = Math.min(480, w - 32);
        const cardH = 95;

        ctx.fillStyle = corruptedBit ? OS.rgba(OS.C.red, 0.15) : OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = corruptedBit ? OS.C.red : OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('CRC32-C (Castagnoli Polynomial) Diagnostics', cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillText(`• Generator Poly: ${poly}`, cardX + 14, cardY + 48);
        ctx.fillText(`• Hardware Throughput: ${throughputGbps} GB/s per core`, cardX + 14, cardY + 68);
        ctx.fillStyle = corruptedBit ? OS.C.red : OS.C.green;
        ctx.fillText(`• Checksum: ${checksum} (${corruptedBit ? 'INVALID' : 'VALID'})`, cardX + 240, cardY + 68);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('HDFS block checksums, Ceph, and SCTP use Castagnoli over standard IEEE because of superior Hamming distance.', 16, h - 16);
      }
    });
    render();
  });

})();
