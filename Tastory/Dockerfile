FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

COPY ["Tasteory.Api/Tasteory.Api.csproj", "Tasteory.Api/"]
COPY ["Tasteory.Application/Tasteory.Application.csproj", "Tasteory.Application/"]
COPY ["Tasteory.Domain/Tasteory.Domain.csproj", "Tasteory.Domain/"]
COPY ["Tasteory.Infrastructure/Tasteory.Infrastructure.csproj", "Tasteory.Infrastructure/"]

RUN dotnet restore "Tasteory.Api/Tasteory.Api.csproj"

COPY . .

RUN dotnet publish "Tasteory.Api/Tasteory.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Tasteory.Api.dll"]