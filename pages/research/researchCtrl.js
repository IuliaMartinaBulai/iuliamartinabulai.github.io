app.controller('researchCtrl', function($scope) {
  pageSet($scope, "Research", "#2b8441", [
    { link: "research/publications",  title: "Publications" },
    { link: "research/teaching",  title: "Teaching" },
  ]);
});
