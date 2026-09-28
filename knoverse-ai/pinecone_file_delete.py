"""Delete every vector belonging to a file from Pinecone."""

import sys

from pinecone import Pinecone

import config


def delete_file_from_pinecone(file_id: str) -> None:
    if not config.PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY is not set in environment variables")

    pc = Pinecone(api_key=config.PINECONE_API_KEY)
    if not pc.has_index(config.PINECONE_INDEX_NAME):
        # Nothing was ever indexed, so there is nothing to delete.
        print(f"Pinecone index {config.PINECONE_INDEX_NAME} does not exist; skipping delete")
        return

    pc.Index(config.PINECONE_INDEX_NAME).delete(
        filter={"file_id": file_id},
        namespace=config.PINECONE_NAMESPACE,
    )
    print(f"Deleted entries with file_id {file_id} from Pinecone index.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python pinecone_file_delete.py <file_id>")
    delete_file_from_pinecone(sys.argv[1])
