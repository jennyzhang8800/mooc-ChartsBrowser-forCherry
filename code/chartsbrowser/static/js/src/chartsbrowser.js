/* Javascript for ChartsBrowswerXBlock. */

String.prototype.replaceInFormat = function(repl) {
    return this.replace(/\{(\w+)\}/g, function(match, capture) {
        return repl[capture];
    });
};

function ChartsBrowswerXBlock(runtime, element) {
    // 这里是配置信息
    var studentInfo = {};
    var filterConfig = {};
    filterConfig.baseUrl = 'http://cherry.cs.tsinghua.edu.cn/static/lams/view/index.html';
    filterConfig.stuReportUrl = 'http://cherry.cs.tsinghua.edu.cn/static/lams/view/report-template/student-status-report.html'
    filterConfig.claReportUrl = 'http://cherry.cs.tsinghua.edu.cn/static/lams/view/report-template/class-status-report.html'
    filterConfig.enable = [
        'student-answer',
        'student-exer-grade',
        'answer-heatmap',
        'piazza-action',
        'student-report',
        'class-report'
    ];
    filterConfig.Visualization = {};
    filterConfig.Visualization['CountStat'] = ['areaspline', 'area', 'line', 'spline', 'column', 'bar']
    filterConfig.filter = {};
    filterConfig.filter['student-answer'] = {
        title: '选择题答案分布',
        view: 'none', // 可浏览的类型 none不可浏览 self尽可浏览自己的数据 all可以浏览所有选项
        required: [
            ['qno', '题号'],
        ],
        optional: [
                ['v', '展现方式', ['pie'].concat(filterConfig.Visualization['CountStat'])],
            ],
            parseUrl: function(data) {
                    var url = '{baseUrl}?v={v}'.replaceInFormat({
                        baseUrl: filterConfig.baseUrl,
                        v: data.v[0]
                    });
                    for (var i in data.qno) {
                        var qno = data.qno[i];
                        url += '&data=data.QuestionAnswerConsumer/{qno}.stat.json'.replaceInFormat({
                            qno: qno,
                        });
                    }
                    return url;
                },
    };
    filterConfig.filter['answer-heatmap'] = {
        title: '回答频率分布',
        view: 'none',
        optional: [
            ['v', '展现方式', 'heatmap'],
        ],
        parseUrl: function(data) {
                var datapath = 'data.StudentAnswerHeatmapConsumer/answerheatmap.stat.json'
                var url = '{baseUrl}?data={datapath}&v={v}'.replaceInFormat({
                    baseUrl: filterConfig.baseUrl,
                    datapath: datapath,
                    v: data.v[0]
                });
                return url;
            }
    };
    filterConfig.filter['student-exer-grade'] = {
        title: '学生练习成绩分布',
        view: 'self',
        required: [
            ['email', '学生的注册邮箱'],
        ],
        optional: [
                ['compare', '是否和平均成绩比较', ['false', 'true']],
                ['v', '展现方式', ['polar'].concat(filterConfig.Visualization['CountStat'])],
            ],
            parseUrl: function(data) {
                    if (!studentInfo.is_staff) {
                        data.email = [studentInfo.email];
                        data.compare = ['true'];
                        data.v = ['polar'];
                    }
                    var url = '{baseUrl}?v={v}'.replaceInFormat({
                        baseUrl: filterConfig.baseUrl,
                        v: data.v[0]
                    });
                    if (data.compare[0] == 'true') {
                        url += '&data=data.SectionScoreConsumer/all.json';
                    }
                    for (var i in data.email) {
                        var email = data.email[i];
                        url += '&data=data.SectionScoreConsumer/{email}.json'.replaceInFormat({
                            email: email,
                        });
                    }
                    return url;
                }
    };
    filterConfig.filter['class-report'] = {
        title: '课程综合报告',
        view: 'none',
        required: [],
        optional: [],
        parseUrl: function(data) {
            return filterConfig.claReportUrl;
        }
    };
    filterConfig.filter['student-report'] = {
        title: '学生综合报告',
        view: 'self',
        required: [
            ['email', '学生的注册邮箱'],
        ],
        optional: [],
        parseUrl: function(data) {
                if (!studentInfo.is_staff) {
                    data.email = [studentInfo.email];
                }

                var url = '{baseUrl}?email={email}'.replaceInFormat({
                    baseUrl: filterConfig.stuReportUrl,
                    email: data.email[0]
                });
                return url;
            }
    };
    filterConfig.filter['piazza-action'] = {
        title: 'piazza平台情况',
        view: 'none',
        required: [],
        optional: [
            ['type', '类别', ['asks', 'days', 'views', 'answers', 'posts']],
            ['v', '展现方式', ['column'].concat(filterConfig.Visualization['CountStat'])],
        ],
        parseUrl: function(data) {
                var datapath = 'data.PiazzaActionCsm/{type}.json'.replaceInFormat({
                    type: data.type[0],
                });
                var url = '{baseUrl}?data={datapath}&v={v}'.replaceInFormat({
                    baseUrl: filterConfig.baseUrl,
                    datapath: datapath,
                    v: data.v[0]
                });
                return url;
            }
    };

    function getChartsInfo() {
        var url = window.location.search;
        var args = {};
        if (url.indexOf('?') != -1) {
            var str = url.substr(1);
            var arglist = str.split('&');
            for (var i in arglist) {
                argstr = arglist[i];
                if (argstr != null & argstr != '') {
                    var key = argstr.split('=')[0];
                    var value = argstr.split('=')[1];
                    if (args[key] == undefined) {
                        args[key] = [];
                    }
                    args[key].push(unescape(value));
                }
            }
        }
        return args;
    }

    function getStudentInfo() {
        var studentInfo = {};
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'getStudentInfo'),
            data: JSON.stringify({'data': 'getStudentInfo'}),
            dataType: 'json',
            async: false,
            success: function(data) {
                studentInfo = data;
            }
        });
        return studentInfo;
    }

    function loadChartFromUrlData(data) {
        if (data == null) return;
        if (data.type == null) return;
        var filter = filterConfig.filter[data.type[0]];
        var url = filter.parseUrl(data);
        $(element).find('iframe').attr('src', url);
    }

    $(function($) {
        var student = getStudentInfo();
        studentInfo = student;
        for (var i in filterConfig.enable) {
            var filter = filterConfig.filter[filterConfig.enable[i]];
            if (student.is_staff || filter.view == 'self' || filter == 'all') {
                // 渲染类型选择框
                $(element).find('.class-select').append(
                    '<option value="{value}">{name}</option>'.replaceInFormat({
                        value: filterConfig.enable[i],
                        name: filter.title,
                    })
                );
            } else {
                console.info('skip ', filterConfig.enable[i]);
            }
        }

        var data = getChartsInfo();
        loadChartFromUrlData(data);
    });

    $(element).on('change', '.class-select', function(e) {
        var type = $(e.target).val();
        var filter = filterConfig.filter[type];

        $(element).find('.form-panel').hide(200);
        $(element).find('.form-panel').empty();

        if (filter == undefined) {
            console.info('filter undefined')
            return;
        }

        if (studentInfo.is_staff || filter.view == 'all') {
            // 渲染必填数据
            for (var j in filter.required) {
                inputItem = filter.required[j];
                $(element).find('.form-panel').append(
                    '<div class="required-input-group">\
                        <label>\
                            <span class="label">{label}:</span>\
                            <input name="{name}" type="text" class="input"/>\
                        </label>\
                    </div>'.replaceInFormat({
                        label: inputItem[1],
                        name: inputItem[0],
                    })
                );
            }

            // 渲染选填数据
            for (var j in filter.optional) {
                inputItem = filter.optional[j];
                if (inputItem[2] instanceof Array) {
                    var htmlStr = '';
                    htmlStr += '<div class="optional-input-group"><label><span class="label">{label}</span>'.replaceInFormat({label: inputItem[1]});
                    htmlStr += '<select name="{name}" class="input">'.replaceInFormat({name: inputItem[0]});
                    var opts = inputItem[2];
                    for (var i in opts) {
                        htmlStr += '<option value="{value}">{value}</option>'.replaceInFormat({value: opts[i]});
                    }
                    htmlStr += '</select>'
                    htmlStr += '</label></div>'
                    $(element).find('.form-panel').append(htmlStr);
                } else {
                    $(element).find('.form-panel').append(
                        '<div class="optional-input-group">\
                            <label>\
                                <span class="label">{label}:</span>\
                                <input name="{name}" value="{value}" type="text" class="input"/>\
                            </label>\
                        </div>'.replaceInFormat({
                            label: inputItem[1],
                            name: inputItem[0],
                            value: inputItem[2],
                        })
                    );
                }
            }
        }

        // 渲染载入按钮
        $(element).find('.form-panel').append(
            '<button class="tool-btn fullscreen" style="float:right">全屏切换</button>' +
                '<button class="tool-btn load-charts" style="float:right">载入</button>' +
                '<div style="clear:both"></div>'
        );

        $(element).find('.form-panel').show(200);
    });

    $(element).on('click', '.load-charts', function(e) {
        var enableType = $(element).find('.class-select').val();
        var data = {};
        $(element).find('.form-panel').find('.input').each(function() {
            var name = $(this).attr('name');
            var value = $(this).val();
            if (value == '')
                return;
            data[name] = value.split(',');
        });
        var filter = filterConfig.filter[enableType];
        var url = filter.parseUrl(data);

        $(element).find('iframe').attr('src', url);
    });

    $(element).on('click', '.fullscreen', function(e) {
        var $view = $('.chartsbrowser_block');
        if (
            document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
        ) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            element = $view.get(0);
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        }
    });
}
