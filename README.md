# book_recommendation_agent

## What is it?
An AI Agent learning project using gpt-3.5 turbo and Google Books to recommend books based on user preferences and provide details about them.



## Technologies Used

### **Backend**
- **Django 5.1.6** - Web framework for building robust applications.
- **Django REST Framework (DRF) 3.15.2** - API framework for building RESTful services.
- **django-cors-headers 4.7.0** - Handles Cross-Origin Resource Sharing (CORS) requests.
- **django-redis 5.4.0** - Integrates Redis caching with Django.
- **SQLParse 0.5.3** - Helps in parsing SQL queries.
- **DefusedXML 0.7.1** - Secure XML parsing.
- **python-dotenv 1.0.1** - Loads environment variables from `.env` files.

### **AI & Machine Learning**
- **OpenAI API 1.65.2** - Used for generating AI-powered book recommendations.
- **Pydantic 2.10.6** - Data validation for OpenAI responses.
- **Pydantic-Core 2.27.2** - Core validation engine for Pydantic.

### **Networking & API Requests**
- **Requests 2.32.3** - Handles HTTP requests for API communication.
- **Requests-Toolbelt 1.0.0** - Enhancements for `requests` library.
- **HTTPX 0.28.1** - Modern HTTP client for handling requests.
- **Httpcore 1.0.7** - Low-level network communication for HTTPX.
- **PySocks 1.7.1** - Proxy support for handling requests.
- **Certifi 2025.1.31** - Ensures SSL certificate verification.

### **Asynchronous Utilities**
- **AnyIO 4.8.0** - Async I/O handling for API requests.
- **Sniffio 1.3.1** - Detects async library usage.
- **Multidict 6.0.5** - Multidictionary support for HTTP requests.

### **Frontend (JavaScript & React)**
- **Next.js** - React-based framework for server-side rendering.
- **TailwindCSS** - Styling framework for responsive UI.
- **TypeScript** - Strongly-typed JavaScript for enhanced development.

### **Development & CLI Enhancements**
- **TQDM 4.67.1** - Progress bar for CLI interactions.
- **Colorama 0.4.6** - Terminal color formatting.
- **Typing-Extensions 4.12.2** - Enhancements for Python's typing system.



## Setup

### 1. Generate requirements file and install dependencies
1. Go to book_recommendation_agent/app

2. Run the script, in terminal type:
  	```python generate_requirements.py```

3. - For Windows:
	  In terminal: 
		```pip install -r requirements_windows.txt```

   - For Linux: 
  	  In terminal:
		```pip install -r requirements_ubuntu.txt```

   - For other OS's: 
  	  In terminal:
		```pip install -r requirements.txt```	

### 2. Create .env file and add your own API keys
1. Find the .env.example file in book_recommendation_agent/app
2. Open the file
3. Add your own API keys as the values for each variable
4. Save the file
5. Rename the file to ".env" (no quotations)

### 3. Run the application
#### 1. Run the backend server
1. Go to book_recommendation_agent/app
2. In terminal type: ```python manage.py runserver```
#### 2. Run the frontend server
1. Go to book_recommendation_agent/frontend
2. In terminal type: ```npm run dev```

### 4. Open the application in your browser
Go to http://localhost:3000 in your preferred browser
