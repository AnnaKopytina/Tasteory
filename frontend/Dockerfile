FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/node_modules \
    && rm -rf /usr/share/nginx/html/package* \
    && rm -rf /usr/share/nginx/html/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]