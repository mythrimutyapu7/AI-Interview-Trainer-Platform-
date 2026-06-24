from dotenv import load_dotenv
load_dotenv()

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from openai import OpenAI

client = OpenAI()

def ingest_resume(pdf_path):

    loader = PyPDFLoader(pdf_path)

    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(docs)

    Chroma.from_documents(
        chunks,
        OpenAIEmbeddings(),
        persist_directory="./vectorstore"
    )

    return True


def retrieve_context(query):

    db = Chroma(
        persist_directory="./vectorstore",
        embedding_function=OpenAIEmbeddings()
    )

    docs = db.similarity_search(query, k=5)

    return "\n".join([doc.page_content for doc in docs])


def generate_questions():

    context = retrieve_context(
        "candidate skills projects experience"
    )

    prompt = f"""
    Based on the following resume context:

    {context}

    Generate 10 technical interview questions.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content