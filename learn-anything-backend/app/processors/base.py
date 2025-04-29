from abc import ABC, abstractmethod
from typing import Union, Dict


class FileProcessor(ABC):
    @abstractmethod
    async def process(self, content: Union[bytes, str], filename: str) -> Dict:
        pass
