# Erasure Coding & Storage Math, Bit by Bit

> An interactive, visual field guide to storage mathematics, erasure coding, and data compression: from finite field Galois arithmetic and Reed-Solomon Cauchy matrices to HDFS 3.0 striped cell architectures, Locally Repairable Codes (LRC), degraded read network penalties, and hardware-accelerated CRC32-C verification.

---

## 🏛️ Curricular Foundations

This curriculum synthesizes reference algorithms and operational architectures from:
- **Thomas M. Cover & Joy A. Thomas**, *Elements of Information Theory* (2nd Edition, Wiley)
- **San Ling & Chaoping Xing**, *Coding Theory: A First Course* (Cambridge University Press)
- **James S. Plank**, *A Tutorial on Reed-Solomon Coding for Fault-Tolerance in RAID-like Systems* & *Jerasure Library*
- **Cheng Huang et al. (Microsoft Research)**, *Erasure Coding in Windows Azure Storage* (USENIX ATC 2012)
- **K. V. Rashmi et al. (CMU / UC Berkeley)**, *A Piggybacking Design Framework for Read and Download Efficient Distributed Storage Codes* (IEEE Trans. Inf. Theory)
- **Apache Hadoop Project**, *HDFS-7285: HDFS Erasure Coding Architecture Guide*

---

## 🔬 Interactive Simulators Included

| Chapter | Simulator | Key Concepts Demonstrated |
|---|---|---|
| **Figure 00** | `ecHero` | HDFS Erasure Coding vs 3x Replication Arena: Storage Overhead vs Failure Recovery |
| **Chapter 01** | `raidParityMatrix` | RAID-5 Single Parity Invariant, Bitwise XOR Properties & Single-Disk Reconstruction |
| **Chapter 02** | `galoisFieldMul` | Galois Field $GF(2^8)$ Arithmetic, Primitive Polynomial `0x11D`, Zero-Overflow Math |
| **Chapter 03** | `gfLookupTables` | Precomputed $GF(2^8)$ Log / Antilog Tables & $O(1)$ Software Multiplication |
| **Chapter 04** | `shannonEntropy` | Shannon Information Entropy $H(X) = -\sum p(x) \log_2 p(x)$ & Lower Compression Bounds |
| **Chapter 05** | `reedSolomonVandermonde` | Reed-Solomon Vandermonde Matrix Distribution: $[D_1..D_k] \times \mathbf{G} \rightarrow [P_1..P_m]$ |
| **Chapter 06** | `cauchyBitmatrix` | Cauchy Reed-Solomon: $8 \times 8$ Binary Bitmatrices & SIMD AVX-512 XOR Schedules |
| **Chapter 07** | `matrixInversionDecode` | Erasure Decoding: Inverting Surviving Submatrix ($\mathbf{A}^{-1} \cdot \mathbf{D}'$) via Gaussian Elimination |
| **Chapter 08** | `systematicCoding` | Systematic vs Non-Systematic Codes: Zero-Copy Linux Kernel `sendfile()` Path |
| **Chapter 09** | `hdfsStriping` | HDFS 3.0 Striped Cell Architecture: 1MB Cell Round-Robin Distribution (RS-6-3-1024k) |
| **Chapter 10** | `degradedReadPenalty` | The Degraded Read Bottleneck: $k\times$ Network Amplification during Single-Drive Repair |
| **Chapter 11** | `locallyRepairableCodes` | Locally Repairable Codes (LRC): Local Parity Groups Slashing Repair Network I/O by 50% |
| **Chapter 12** | `hitchhikerCodes` | Hitchhiker / Piggybacked Codes: Sub-Chunk I/O Savings in Distributed Storage |
| **Chapter 13** | `lz77SlidingWindow` | LZ77 Sliding Window Dictionaries, Token Streams & Snappy/LZ4 Execution Strides |
| **Chapter 14** | `huffmanEncoding` | Huffman Coding: Optimal Prefix-Free Binary Trees & Variable-Length Bitstreams |
| **Chapter 15** | `crc32Hardware` | Hardware CRC32-C (Castagnoli Polynomial) & 30+ GB/s SSE4.2 / ARMv8 Integrity Checks |

---

## 🧪 Automated Testing & Verification

The test harness mounts all 16 simulators across 4 viewports (320px, 480px, 768px, 1200px) and exercises all interactive controls:

```bash
npm test
```

---

## 🚀 Deployment

Zero-build vanilla web architecture. Built with pure HTML5, CSS3, and ES6+ Canvas APIs.
Hosted on GitHub Pages.
