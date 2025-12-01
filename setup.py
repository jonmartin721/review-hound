from setuptools import setup, find_packages

setup(
    name="reviewhound",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "beautifulsoup4>=4.12.0",
        "requests>=2.31.0",
        "sqlalchemy>=2.0.0",
        "textblob>=0.18.0",
        "flask>=3.0.0",
        "apscheduler>=3.10.0",
        "click>=8.1.0",
        "rich>=13.0.0",
        "python-dotenv>=1.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0.0",
            "pytest-cov>=4.0.0",
            "responses>=0.25.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "reviewhound=reviewhound.cli:cli",
        ],
    },
    python_requires=">=3.11",
)
