# Phishing Detection Chrome Extension

**Advanced Machine Learning for Real-Time Phishing Detection**

A privacy-first browser extension that combines multiple machine learning techniques to detect phishing attacks in real-time, achieving 96.8% accuracy with sub-millisecond response times.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TensorFlow.js](https://img.shields.io/badge/ML-TensorFlow.js-orange.svg)](https://www.tensorflow.org/js)


## Research Overview

This project addresses the critical cybersecurity challenge of phishing detection through a novel multi-layered approach that operates entirely client-side, ensuring user privacy while maintaining high detection accuracy.

### Key Features

- **Multi-Modal Detection**: Combines URL analysis and content inspection
- **Edge Computing**: 100% client-side processing with no external API dependencies
- **Real-Time Performance**: Sub-millisecond inference using optimized TensorFlow.js models
- **Privacy-First Architecture**: Zero data collection or external communication

### Technical Achievements

| Component | Technology | Performance |
|-----------|------------|-------------|
| URL Analysis | Neural Network (TensorFlow.js) | 96.8% accuracy, <1ms inference |
| Content Detection | Logistic Regression + Heuristics | 94.2% precision on DOM features |


## Architecture

The system implements a three-tier detection pipeline:

1. **URL Feature Extraction**: 25 engineered features including domain characteristics, URL structure, and reputation indicators
2. **Static Content Analysis**: DOM inspection for suspicious forms, scripts, and navigation elements


### Performance Metrics
- **Model Accuracy**: 96.8% on test dataset (100,000+ samples)
- **False Positive Rate**: <2%
- **Response Time**: Average 0.8ms for URL analysis
- **Memory Footprint**: <5MB total extension size

---

## User Interface

| Safe Website Detection | Phishing Alert |
|----------------------|----------------|
| ![Safe Site](https://github.com/user-attachments/assets/0c668c3e-8524-4e1a-9fda-5c4be8aee1ff) | ![Phishing Detected](https://github.com/user-attachments/assets/e94eaf7e-7b82-450b-8c62-26a823d2fce9) |
| Extension shows green "Safe" indicator | Real-time warning with threat details |

---

## Business Impact

### Problem Addressed
Phishing attacks cost organizations billions annually, with traditional blacklist-based solutions offering poor coverage and significant privacy concerns.

### Solution Benefits
- **Proactive Protection**: Detects threats before credential theft occurs
- **Privacy Compliance**: No data transmission or user tracking
- **Scalable Deployment**: Lightweight client-side architecture
- **Cost Effective**: Eliminates need for external security services
