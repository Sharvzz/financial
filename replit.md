# Overview

Credora is a personal finance management application built with a React frontend and localStorage-based data persistence. The application allows users to manage their financial transactions, categorize expenses and income, and track their financial activities. It's designed as a lightweight, client-side solution that doesn't require a backend server for data storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React 19 with Vite as the build tool and development server. The application uses a component-based architecture with React Router DOM for client-side routing. Styling is handled through Tailwind CSS v4, providing a utility-first approach to styling.

## Data Layer
The application uses a localStorage-based data persistence layer instead of a traditional database. This design choice eliminates the need for a backend server and provides immediate data availability. The storage service manages four main data types:
- Users (authentication data with basic password hashing)
- Categories (expense/income categorization)
- Transactions (financial records)
- Authentication tokens (simple email-based tokens)

## Authentication System
A simple client-side authentication system is implemented using localStorage. Password hashing is performed using basic base64 encoding (clearly marked as not production-ready). The authentication token is the user's email address, stored in localStorage for session persistence.

## State Management
The application appears to use React's built-in state management capabilities rather than external state management libraries like Redux or Zustand. Data is managed through the storage service layer that provides CRUD operations for all entity types.

## Development Environment
The development setup includes:
- Vite for fast development builds and hot module replacement
- ESLint for code quality with React-specific rules
- Tailwind CSS with Vite integration for styling
- Development server configured to run on port 5000 with host binding for container compatibility

# External Dependencies

## Core Dependencies
- **React 19.1.1**: Frontend framework for building the user interface
- **React DOM**: React rendering library
- **React Router DOM 7.8.1**: Client-side routing solution
- **Axios 1.11.0**: HTTP client for potential API communications
- **Tailwind CSS 4.1.12**: Utility-first CSS framework for styling

## Development Dependencies
- **Vite 7.1.2**: Build tool and development server
- **ESLint**: Code linting with React-specific plugins
- **TypeScript types**: Type definitions for React and React DOM

## Storage Solution
- **localStorage**: Browser-based storage for data persistence (no external database required)

The application is designed to be completely self-contained with no external API dependencies or database requirements, making it suitable for offline use and simple deployment scenarios.