FROM gcc:9.4

RUN wget https://github.com/Kitware/CMake/releases/download/v3.23.1/cmake-3.23.1-linux-x86_64.tar.gz && tar zxf cmake-3.23.1-linux-x86_64.tar.gz -C /usr


